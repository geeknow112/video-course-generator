#!/usr/bin/env python3
"""
レクチャーミックススクリプト

parts/{lecture_id}/ にあるWAVとPNGから動画を生成して結合
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

# パス設定
BASE_DIR = Path(__file__).parent.parent
SLIDES_DIR = BASE_DIR / "slides"
PARTS_DIR = BASE_DIR / "video-generator" / "output" / "parts"
VIDEOS_DIR = BASE_DIR / "video-generator" / "output" / "videos"
GDRIVE_DIR = Path("H:/マイドライブ/d.動画作成/udemy_course/video-generator/output/videos")

VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080


def export_slide_images(slide_md: str, output_dir: Path, lecture_id: str) -> list:
    """MarpでスライドをPNG画像に変換"""
    slide_path = SLIDES_DIR / slide_md
    
    if not slide_path.exists():
        raise Exception(f"スライドが見つかりません: {slide_path}")
    
    # Marpで画像出力
    output_pattern = output_dir / f"{lecture_id}_page.png"
    cmd = ["marp", str(slide_path), "--images", "png", "-o", str(output_pattern)]
    
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        raise Exception(f"marp failed: {result.stderr}")
    
    # 生成されたPNGを取得
    png_files = sorted(output_dir.glob(f"{lecture_id}_page.*.png"))
    
    # ファイル名をpage_01.pngの形式にリネーム（既存ファイルは上書き）
    renamed = []
    for i, png in enumerate(png_files):
        new_name = output_dir / f"page_{i+1:02d}.png"
        png.replace(new_name)
        renamed.append(new_name)
    
    return renamed


def create_page_video(png_path: Path, wav_path: Path, output_path: Path, silence_after: float = 0):
    """PNG + WAV から動画を生成（無音部分も音声トラックを維持）"""
    
    # 音声の長さを取得
    probe_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(wav_path)]
    result = subprocess.run(probe_cmd, capture_output=True, text=True)
    duration = float(result.stdout.strip())
    
    total_duration = duration + silence_after
    
    # WAVに無音を追加してから動画生成（音声トラックを途切れさせない）
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(png_path),
        "-i", str(wav_path),
        "-filter_complex", f"[1:a]apad=whole_dur={total_duration}[a]",
        "-map", "0:v",
        "-map", "[a]",
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-t", str(total_duration),
        str(output_path)
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"ffmpeg failed: {result.stderr}")
    
    return duration


def concatenate_videos(video_paths: list, output_path: Path):
    """動画を結合"""
    list_path = output_path.parent / "concat_list.txt"
    with open(list_path, "w", encoding="utf-8") as f:
        for vp in video_paths:
            f.write(f"file '{str(vp).replace(os.sep, '/')}'\n")
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(list_path),
        "-c", "copy",
        str(output_path)
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    list_path.unlink()
    
    if result.returncode != 0:
        raise Exception(f"ffmpeg concat failed: {result.stderr}")


def concat_only(lecture_id: str):
    """_work配下のページ動画を結合のみ"""
    
    print(f"=== {lecture_id} 結合のみ ===")
    
    parts_dir = PARTS_DIR / lecture_id
    work_dir = parts_dir / "_work"
    
    if not work_dir.exists():
        print(f"エラー: _workフォルダが見つかりません: {work_dir}")
        return False
    
    # ページ動画を取得
    page_videos = sorted(work_dir.glob("page_*.mp4"))
    if not page_videos:
        print(f"エラー: ページ動画が見つかりません")
        return False
    
    print(f"ページ動画: {len(page_videos)}個")
    
    # 結合
    print("結合中...")
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    final_path = VIDEOS_DIR / f"{lecture_id}.mp4"
    
    concatenate_videos(page_videos, final_path)
    
    print(f"完了: {final_path}")
    return True


def mix_lecture(lecture_id: str, slide_md: str):
    """WAVとPNGから動画を生成して結合"""
    
    print(f"=== {lecture_id} ミックス ===")
    
    parts_dir = PARTS_DIR / lecture_id
    work_dir = parts_dir / "_work"
    
    # _workフォルダをクリア（既存ファイルを削除）
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(exist_ok=True)
    
    # WAVファイルを取得
    wav_files = sorted(parts_dir.glob(f"{lecture_id}_page*.wav"))
    if not wav_files:
        print(f"エラー: WAVファイルが見つかりません")
        return False
    
    print(f"WAVファイル: {len(wav_files)}個")
    
    # スライド画像を生成
    print("スライド画像生成中...")
    png_files = export_slide_images(slide_md, work_dir, lecture_id)
    print(f"PNG生成: {len(png_files)}枚")
    
    if len(wav_files) != len(png_files):
        print(f"エラー: WAV({len(wav_files)})とPNG({len(png_files)})の数が一致しません")
        return False
    
    # 各ページの動画を生成
    print("ページ動画生成中...")
    page_videos = []
    
    for i, (wav_path, png_path) in enumerate(zip(wav_files, png_files)):
        page_num = i + 1
        page_video = work_dir / f"page_{page_num:02d}.mp4"
        
        # 全ページに7秒の余韻
        silence_after = 7.0
        
        duration = create_page_video(png_path, wav_path, page_video, silence_after)
        print(f"  ページ{page_num}: {duration:.1f}秒 + {silence_after:.0f}秒")
        
        page_videos.append(page_video)
    
    # 結合
    print("結合中...")
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    final_path = VIDEOS_DIR / f"{lecture_id}.mp4"
    
    concatenate_videos(page_videos, final_path)
    
    # Googleドライブにコピー
    print("Googleドライブにコピー中...")
    GDRIVE_DIR.mkdir(parents=True, exist_ok=True)
    gdrive_path = GDRIVE_DIR / f"{lecture_id}.mp4"
    shutil.copy2(final_path, gdrive_path)
    
    print(f"完了: {final_path}")
    print(f"コピー先: {gdrive_path}")
    return True


def main():
    parser = argparse.ArgumentParser(description="レクチャーミックス")
    parser.add_argument("lecture_id", help="レクチャーID")
    parser.add_argument("--slide", help="スライドファイル名")
    parser.add_argument("--concat-only", action="store_true", help="_work配下のページ動画を結合のみ")
    
    args = parser.parse_args()
    
    if args.concat_only:
        success = concat_only(args.lecture_id)
    else:
        if not args.slide:
            print("エラー: --slideオプションが必要です")
            sys.exit(1)
        success = mix_lecture(args.lecture_id, args.slide)
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
