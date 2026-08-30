<#
.SYNOPSIS
  コース動画を無人で生成する。

.DESCRIPTION
  VOICEVOX エンジンが止まっていれば自分で起動し、course.ts を回し、
  自分で起動したぶんだけ後片付けする。
  Claude Code やターミナルのセッションに依存しないため、
  タスクスケジューラからも、ダブルクリックからも実行できる。

  既に VOICEVOX（GUI 版を含む）が動いている場合は、それを使い、終了もさせない。

  CourseId を省略するか all を渡すと、courses/*.yaml の全コースを順に処理する。
  未生成のレッスンだけが対象になるため、全部済んでいれば数秒で終わる。

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\run-course.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\run-course.ps1 -CourseId 001_cicd -Only "2-2,2-3"
#>

[CmdletBinding()]
param(
    # コース ID。省略時は全コース。
    [string]$CourseId = 'all',

    # 生成済みも作り直す
    [switch]$Force,

    # 対象レッスンを絞る（カンマ区切り）。単一コース指定時のみ有効。
    [string]$Only,

    # 途中の工程から始める（audio / prepare / slides / video）
    [string]$From,

    # エンジンの起動を待つ最大秒数
    [int]$EngineTimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$GeneratorDir = Join-Path $RepoRoot 'video-generator'
$CoursesDir = Join-Path $RepoRoot 'courses'
$LogDir = Join-Path $RepoRoot 'logs'
$VoicevoxHost = if ($env:VOICEVOX_HOST) { $env:VOICEVOX_HOST } else { 'http://localhost:50021' }

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogPath = Join-Path $LogDir ("{0}_{1}.log" -f $CourseId, (Get-Date -Format 'yyyyMMdd-HHmmss'))

function Write-Log {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -Path $LogPath -Value $line -Encoding utf8
}

function Test-Voicevox {
    try {
        $response = Invoke-WebRequest -Uri "$VoicevoxHost/version" -TimeoutSec 3 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Find-VoicevoxEngine {
    $candidates = @(
        (Join-Path $env:ProgramFiles 'VOICEVOX\vv-engine\run.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\VOICEVOX\vv-engine\run.exe')
    )
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) { return $candidate }
    }
    return $null
}

# --- 対象コースを決める ------------------------------------------------------

if ($CourseId -eq 'all') {
    $targets = Get-ChildItem -Path $CoursesDir -Filter '*.yaml' -ErrorAction SilentlyContinue |
               Sort-Object Name |
               ForEach-Object { $_.BaseName }
    if (-not $targets) {
        Write-Log "エラー: courses\ にコース定義がありません。"
        exit 1
    }
    if ($Only) {
        Write-Log "警告: -Only は単一コース指定時のみ有効です。無視します。"
        $Only = $null
    }
} else {
    $targets = @($CourseId)
}

Write-Log ("対象コース: {0}" -f ($targets -join ', '))

# --- 二重起動の防止 ----------------------------------------------------------
# 同じ成果物を2つのプロセスが同時に書くと壊れる。
# スケジューラ実行と手動実行が重なる場合を想定している。

$LockPath = Join-Path $LogDir '.run-course.lock'

if (Test-Path $LockPath) {
    $holder = (Get-Content $LockPath -ErrorAction SilentlyContinue | Select-Object -First 1)
    $alive = $false
    if ($holder -match '^\d+$') {
        $alive = $null -ne (Get-Process -Id ([int]$holder) -ErrorAction SilentlyContinue)
    }

    if ($alive) {
        Write-Log "別の生成が実行中です（PID $holder）。今回は何もせず終了します。"
        exit 0
    }

    Write-Log "古いロックが残っていました（PID $holder は不在）。引き継ぎます。"
    Remove-Item $LockPath -Force -ErrorAction SilentlyContinue
}

Set-Content -Path $LockPath -Value $PID -Encoding ascii

# --- VOICEVOX の用意 ---------------------------------------------------------

$startedEngine = $null

if (Test-Voicevox) {
    Write-Log "VOICEVOX は起動済みです。そのまま使います。"
} else {
    $enginePath = Find-VoicevoxEngine
    if (-not $enginePath) {
        Write-Log "エラー: VOICEVOX エンジンが見つかりません。"
        Write-Log "  探した場所: Program Files\VOICEVOX\vv-engine\run.exe"
        exit 1
    }

    Write-Log "VOICEVOX エンジンを起動します: $enginePath"
    $startedEngine = Start-Process -FilePath $enginePath -WindowStyle Hidden -PassThru

    $deadline = (Get-Date).AddSeconds($EngineTimeoutSeconds)
    while (-not (Test-Voicevox)) {
        if ((Get-Date) -gt $deadline) {
            Write-Log "エラー: エンジンが $EngineTimeoutSeconds 秒以内に応答しませんでした。"
            if ($startedEngine -and -not $startedEngine.HasExited) { Stop-Process -Id $startedEngine.Id -Force }
            exit 1
        }
        Start-Sleep -Seconds 3
    }
    Write-Log "エンジンが応答しました。"
}

# --- 生成 --------------------------------------------------------------------

$failed = @()

try {
    Push-Location $GeneratorDir

    foreach ($target in $targets) {
        $npmArgs = @('run', '--silent', 'course', '--', $target)
        if ($Only)  { $npmArgs += @('--only', $Only) }
        if ($From)  { $npmArgs += @('--from', $From) }
        if ($Force) { $npmArgs += '--force' }

        Write-Log "--- $target 開始 ---"
        & npm @npmArgs 2>&1 | Tee-Object -FilePath $LogPath -Append

        if ($LASTEXITCODE -ne 0) {
            Write-Log "$target で失敗したレッスンがあります（終了コード $LASTEXITCODE）。"
            $failed += $target
        } else {
            Write-Log "$target 完了。"
        }
    }
} finally {
    Pop-Location

    if ($startedEngine -and -not $startedEngine.HasExited) {
        Write-Log "自分で起動したエンジンを終了します。"
        Stop-Process -Id $startedEngine.Id -Force
    }

    Remove-Item $LockPath -Force -ErrorAction SilentlyContinue
}

if ($failed.Count -eq 0) {
    Write-Log "すべて完了しました。ログ: $LogPath"
    exit 0
}

Write-Log ("失敗したコース: {0}。ログ: {1}" -f ($failed -join ', '), $LogPath)
exit 1
