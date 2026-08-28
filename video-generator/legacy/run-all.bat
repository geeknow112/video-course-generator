@echo off
cd /d "C:\Users\youre\Documents\git_repo\video-course-generator\video-generator"

echo === 003_kiro コース動画生成 (録画方式) ===
echo.

echo [1/9] 1-2 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\1-2_Kiroとは.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\1-2\1-2_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\1-2\1-2_timings.json" "output\003_kiro\1-2_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 1-2 failed

echo.
echo [2/9] 2-1 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\2-1_Autopilot有効化.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\2-1\2-1_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\2-1\2-1_timings.json" "output\003_kiro\2-1_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 2-1 failed

echo.
echo [3/9] 3-1 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\3-1_Steering基本.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\3-1\3-1_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\3-1\3-1_timings.json" "output\003_kiro\3-1_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 3-1 failed

echo.
echo [4/9] 3-2 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\3-2_Steeringテンプレート.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\3-2\3-2_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\3-2\3-2_timings.json" "output\003_kiro\3-2_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 3-2 failed

echo.
echo [5/9] 4-1 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\4-1_Hooks基本.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\4-1\4-1_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\4-1\4-1_timings.json" "output\003_kiro\4-1_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 4-1 failed

echo.
echo [6/9] 4-2 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\4-2_Hooksテンプレート.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\4-2\4-2_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\4-2\4-2_timings.json" "output\003_kiro\4-2_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 4-2 failed

echo.
echo [7/9] 5-1 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\5-1_完全オート実践.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\5-1\5-1_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\5-1\5-1_timings.json" "output\003_kiro\5-1_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 5-1 failed

echo.
echo [8/9] 5-2 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\5-2_リポジトリ調査.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\5-2\5-2_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\5-2\5-2_timings.json" "output\003_kiro\5-2_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 5-2 failed

echo.
echo [9/9] 6-1 生成中...
call npx ts-node generate-video-v3.ts "C:\Users\youre\Documents\git_repo\video-course-generator\slides\003_kiro\6-1_コースまとめ.html" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\6-1\6-1_combined.wav" "C:\Users\youre\Documents\git_repo\video-course-generator\audio\6-1\6-1_timings.json" "output\003_kiro\6-1_recorded.mp4"
if %errorlevel% neq 0 echo ERROR: 6-1 failed

echo.
echo === 完了 ===
echo 動画は output\003_kiro\ に保存されました
pause
