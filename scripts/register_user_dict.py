#!/usr/bin/env python3
"""
VOICEVOXユーザー辞書の復元スクリプト

VOICEVOXのユーザー辞書はエンジンのローカル設定であり、
エンジンの再インストールや別PCへの移行で消える。
scripts/voicevox_user_dict.json を正として、POST /user_dict_word で
1件ずつ登録し直すことで、どの環境でも同じ読みを再現する。

対象語（誤読対策・登録済み4件）:
    npm  -> エヌピーエム（未登録だと「ンプ」と読まれる）
    Q2   -> キューニ
    Hooks -> フックス
    VS   -> ブイエス（"VS Code"のスペース区切りに対応するため VS 単体で登録）

使い方:
    python scripts/register_user_dict.py
    python scripts/register_user_dict.py --host http://localhost:50021
    python scripts/register_user_dict.py --dict-file scripts/voicevox_user_dict.json
"""

import argparse
import json
import os
import sys
from pathlib import Path

import requests

DEFAULT_DICT_FILE = Path(__file__).parent / "voicevox_user_dict.json"
VOICEVOX_HOST = os.environ.get("VOICEVOX_HOST", "http://localhost:50021")


def load_words(dict_file: Path) -> list:
    with open(dict_file, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_existing(host: str) -> dict:
    """登録済みのユーザー辞書を取得。(surface, pronunciation)の重複登録を避けるために使う。"""
    response = requests.get(f"{host}/user_dict")
    response.raise_for_status()
    return response.json()


def already_registered(existing: dict, surface: str, pronunciation: str) -> bool:
    for word in existing.values():
        # 登録時に全角化されて保存されるため、NFKC正規化してから比較する
        import unicodedata
        stored_surface = unicodedata.normalize("NFKC", word.get("surface", ""))
        target_surface = unicodedata.normalize("NFKC", surface)
        if stored_surface == target_surface and word.get("pronunciation") == pronunciation:
            return True
    return False


def register_word(host: str, word: dict) -> None:
    params = {
        "surface": word["surface"],
        "pronunciation": word["pronunciation"],
        "accent_type": word["accent_type"],
    }
    if "word_type" in word:
        params["word_type"] = word["word_type"]
    if "priority" in word:
        params["priority"] = word["priority"]

    response = requests.post(f"{host}/user_dict_word", params=params)
    response.raise_for_status()


def main():
    parser = argparse.ArgumentParser(description="VOICEVOXユーザー辞書の復元")
    parser.add_argument("--host", default=VOICEVOX_HOST, help=f"VOICEVOXのホスト（既定: {VOICEVOX_HOST}）")
    parser.add_argument("--dict-file", default=str(DEFAULT_DICT_FILE), help="登録する辞書定義ファイル")
    args = parser.parse_args()

    dict_file = Path(args.dict_file)
    if not dict_file.exists():
        print(f"エラー: 辞書ファイルが見つかりません: {dict_file}")
        sys.exit(1)

    words = load_words(dict_file)
    print(f"=== VOICEVOXユーザー辞書の復元 ===")
    print(f"辞書定義: {dict_file}")
    print(f"接続先  : {args.host}")
    print(f"対象    : {len(words)}件")
    print()

    try:
        existing = fetch_existing(args.host)
    except requests.exceptions.RequestException as e:
        print(f"エラー: VOICEVOXに接続できません（{args.host}）: {e}")
        sys.exit(1)

    registered = 0
    skipped = 0
    for word in words:
        surface = word["surface"]
        pronunciation = word["pronunciation"]

        if already_registered(existing, surface, pronunciation):
            print(f"  [スキップ] {surface} -> {pronunciation}（登録済み）")
            skipped += 1
            continue

        try:
            register_word(args.host, word)
            print(f"  [登録]     {surface} -> {pronunciation}")
            registered += 1
        except requests.exceptions.RequestException as e:
            print(f"  [エラー]   {surface} -> {pronunciation}: {e}")
            sys.exit(1)

    print()
    print(f"完了: 登録{registered}件 / スキップ{skipped}件")


if __name__ == "__main__":
    main()
