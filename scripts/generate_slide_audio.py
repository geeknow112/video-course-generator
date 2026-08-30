#!/usr/bin/env python3
"""
スライド単位音声生成スクリプト

台本を---で分割し、各スライドページごとにWAVファイルを生成
"""

import argparse
import json
import os
import sys
import time
import wave
from pathlib import Path

import requests

# VOICEVOX設定（--host / --speaker、または環境変数で上書きできる）
VOICEVOX_HOST = os.environ.get("VOICEVOX_HOST", "http://localhost:50021")
SPEAKER_ID = 2  # 四国めたん ノーマル

# 音声パラメータの既定値（2026-08-30 社長決定）。
# 比較試聴（audio/_quality_test_v2/）の結果、中庸案（center）を採用。
# 狙いは「速く・平坦に」読み上げること（ゆっくり霊夢寄りのテンポ）。
# prePhonemeLength/postPhonemeLength は center 音源の再現に必要な値
# （社長からの指示文には明記されていないが、比較試聴で聴いていた音源はこの値で
#  生成されている。詳細は audio/_quality_test_v2/README.md 参照）。
DEFAULT_SPEED_SCALE = 1.2
DEFAULT_INTONATION_SCALE = 0.7
DEFAULT_PITCH_SCALE = 0.03
DEFAULT_PAUSE_LENGTH_SCALE = 0.8
DEFAULT_PRE_PHONEME_LENGTH = 0.05
DEFAULT_POST_PHONEME_LENGTH = 0.05

# 音声合成パラメータの上書き値。
# --speed 等のCLI引数は上記の確定値をデフォルトに持つため、未指定でも
# 常にこの確定値が synthesis に渡る（audio_query の生の既定値には戻らない）。
# volumeScale だけは今回の決定に含まれないため、未指定（None）なら
# audio_query の既定値（1.0）のまま渡す。
QUERY_OVERRIDES = {
    "speedScale": None,
    "pitchScale": None,
    "intonationScale": None,
    "volumeScale": None,
    "pauseLengthScale": None,
    "prePhonemeLength": None,
    "postPhonemeLength": None,
}


def text_to_speech(text: str, output_path: Path) -> float:
    """テキストを音声に変換してWAVファイルを保存"""
    # 音声合成用クエリを作成
    query_response = requests.post(
        f"{VOICEVOX_HOST}/audio_query",
        params={"text": text, "speaker": SPEAKER_ID}
    )
    query_response.raise_for_status()
    query = query_response.json()

    # 明示的に指定されたパラメータだけ上書きする（未指定はaudio_queryの既定値のまま）
    for key, value in QUERY_OVERRIDES.items():
        if value is not None:
            query[key] = value

    # 音声合成
    synthesis_response = requests.post(
        f"{VOICEVOX_HOST}/synthesis",
        params={"speaker": SPEAKER_ID},
        json=query
    )
    synthesis_response.raise_for_status()
    
    # WAVファイルを保存
    with open(output_path, "wb") as f:
        f.write(synthesis_response.content)
    
    # 音声の長さを取得
    with wave.open(str(output_path), "rb") as wav_file:
        frames = wav_file.getnframes()
        rate = wav_file.getframerate()
        duration = frames / float(rate)
    
    return duration


def parse_script(script_path: Path) -> list:
    """台本ファイルをパースしてスライドごとのテキストリストを返す"""
    with open(script_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # ---で区切る（改行を含む）
    import re
    sections = re.split(r'\r?\n---\r?\n', content)
    
    # 空のセクションを除去し、前後の空白をトリム
    sections = [s.strip() for s in sections if s.strip()]
    
    return sections


def generate_slide_audio(script_path: Path, output_dir: Path, lecture_id: str):
    """スライドごとの音声を生成"""
    
    print(f"=== {lecture_id} 音声生成 ===")
    print(f"台本: {script_path}")
    print(f"出力先: {output_dir}")
    
    # 台本をパース
    sections = parse_script(script_path)
    print(f"スライド数: {len(sections)}ページ")
    print()
    
    # 出力ディレクトリを作成
    lecture_dir = output_dir / lecture_id
    lecture_dir.mkdir(parents=True, exist_ok=True)
    
    # メタデータファイル（1ファイルに統合）
    meta_path = lecture_dir / f"{lecture_id}.json"
    existing_meta = None
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            existing_meta = json.load(f)
    
    results = []
    
    for i, text in enumerate(sections):
        page_num = i + 1
        page_id = f"{lecture_id}_page{page_num:02d}"
        wav_path = lecture_dir / f"{page_id}.wav"
        
        # 既に生成済みならスキップ
        if wav_path.exists() and existing_meta:
            page_meta = next((p for p in existing_meta.get("pages", []) if p["page"] == page_num), None)
            if page_meta:
                print(f"  [スキップ] ページ{page_num} (既存: {page_meta['duration']:.1f}秒)")
                results.append({
                    "page": page_num,
                    "wav": str(wav_path),
                    "duration": page_meta["duration"],
                    "text": text
                })
                continue
        
        preview = text[:40].replace('\n', ' ')
        print(f"  [生成中] ページ{page_num}: {preview}...")
        
        try:
            duration = text_to_speech(text, wav_path)
            
            print(f"           完了 ({duration:.1f}秒)")
            results.append({
                "page": page_num,
                "wav": str(wav_path),
                "duration": duration,
                "text": text
            })
            
            # API制限対策
            time.sleep(0.1)
            
        except Exception as e:
            print(f"           エラー: {e}")
            return None
    
    # レクチャー全体のメタデータを1ファイルに保存
    total_duration = sum(r["duration"] for r in results)
    lecture_meta = {
        "lecture_id": lecture_id,
        "total_pages": len(sections),
        "total_duration": total_duration,
        "pages": results
    }
    
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(lecture_meta, f, ensure_ascii=False, indent=2)
    
    print()
    print(f"完了: {len(results)}ページ, 合計{total_duration:.1f}秒")
    
    return lecture_meta


def main():
    # コース定義から渡された値でグローバル設定を上書きするため先に宣言する
    global SPEAKER_ID, VOICEVOX_HOST

    parser = argparse.ArgumentParser(description="スライド単位音声生成")
    parser.add_argument("--script", required=True, help="台本ファイルのパス")
    parser.add_argument("--output-dir", required=True, help="出力ディレクトリ")
    parser.add_argument("--lecture-id", required=True, help="レクチャーID（例: 3-1）")
    parser.add_argument("--speaker", type=int, default=SPEAKER_ID,
                        help=f"VOICEVOXの話者ID（既定: {SPEAKER_ID} 四国めたん ノーマル）")
    parser.add_argument("--host", default=VOICEVOX_HOST,
                        help=f"VOICEVOXのホスト（既定: {VOICEVOX_HOST}）")
    # 音声パラメータ。既定値は2026-08-30社長決定のcenter案（DEFAULT_*定数）。
    # 個別に変えたいときだけCLI引数で上書きする。
    parser.add_argument("--speed", type=float, default=DEFAULT_SPEED_SCALE,
                        help=f"speedScale（既定: {DEFAULT_SPEED_SCALE}）")
    parser.add_argument("--pitch", type=float, default=DEFAULT_PITCH_SCALE,
                        help=f"pitchScale（既定: {DEFAULT_PITCH_SCALE}）")
    parser.add_argument("--intonation", type=float, default=DEFAULT_INTONATION_SCALE,
                        help=f"intonationScale（既定: {DEFAULT_INTONATION_SCALE}）")
    parser.add_argument("--volume", type=float, default=None,
                        help="volumeScaleを上書き（既定はaudio_queryの1.0のまま。今回の決定に含まれない）")
    parser.add_argument("--pause-scale", type=float, default=DEFAULT_PAUSE_LENGTH_SCALE,
                        help=f"pauseLengthScale（既定: {DEFAULT_PAUSE_LENGTH_SCALE}）")
    parser.add_argument("--pre-phoneme-length", type=float, default=DEFAULT_PRE_PHONEME_LENGTH,
                        help=f"prePhonemeLength（既定: {DEFAULT_PRE_PHONEME_LENGTH}）")
    parser.add_argument("--post-phoneme-length", type=float, default=DEFAULT_POST_PHONEME_LENGTH,
                        help=f"postPhonemeLength（既定: {DEFAULT_POST_PHONEME_LENGTH}）")

    args = parser.parse_args()

    SPEAKER_ID = args.speaker
    VOICEVOX_HOST = args.host

    QUERY_OVERRIDES["speedScale"] = args.speed
    QUERY_OVERRIDES["pitchScale"] = args.pitch
    QUERY_OVERRIDES["intonationScale"] = args.intonation
    QUERY_OVERRIDES["volumeScale"] = args.volume
    QUERY_OVERRIDES["pauseLengthScale"] = args.pause_scale
    QUERY_OVERRIDES["prePhonemeLength"] = args.pre_phoneme_length
    QUERY_OVERRIDES["postPhonemeLength"] = args.post_phoneme_length

    script_path = Path(args.script)
    output_dir = Path(args.output_dir)
    
    if not script_path.exists():
        print(f"エラー: 台本ファイルが見つかりません: {script_path}")
        sys.exit(1)
    
    result = generate_slide_audio(script_path, output_dir, args.lecture_id)
    
    if result:
        print(json.dumps(result, ensure_ascii=False))
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
