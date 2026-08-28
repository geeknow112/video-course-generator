#!/usr/bin/env python3
"""003_kiro コース一括音声生成"""
import subprocess
import sys
from pathlib import Path

PYTHON = r"c:\Users\youre\Documents\git_repo\.venv\Scripts\python.exe"
SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR.parent / "audio"

lectures = [
    ("003_kiro/1-1_コース紹介.txt", "1-1"),
    ("003_kiro/1-2_Kiroとは.txt", "1-2"),
    ("003_kiro/2-1_Autopilot有効化.txt", "2-1"),
    ("003_kiro/3-1_Steering基本.txt", "3-1"),
    ("003_kiro/3-2_Steeringテンプレート.txt", "3-2"),
    ("003_kiro/4-1_Hooks基本.txt", "4-1"),
    ("003_kiro/4-2_Hooksテンプレート.txt", "4-2"),
    ("003_kiro/5-1_完全オート実践.txt", "5-1"),
    ("003_kiro/5-2_リポジトリ調査.txt", "5-2"),
    ("003_kiro/6-1_コースまとめ.txt", "6-1"),
]

for script, lecture_id in lectures:
    print(f"\n{'='*50}")
    print(f"生成中: {lecture_id}")
    print(f"{'='*50}")
    
    cmd = [
        PYTHON,
        str(SCRIPT_DIR / "generate_slide_audio.py"),
        "--script", str(SCRIPT_DIR / script),
        "--output-dir", str(AUDIO_DIR),
        "--lecture-id", lecture_id
    ]
    
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print(f"エラー: {lecture_id}")
        sys.exit(1)

print("\n" + "="*50)
print("全レクチャーの音声生成完了!")
print("="*50)
