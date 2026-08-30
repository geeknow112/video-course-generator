# 音声品質比較 v2（feature/voice-quality）

前回（`audio/_quality_test/`）は「落ち着いた速度＋抑揚を強める」方向で検討したが、
社長のフィードバックで方向転換。

> 聞いた。余り改善が見られない。読み上げスピードを少し早めて。イメージはゆっくり霊夢の音声。

**今回は逆方向。速度を上げ、抑揚を抑え、間を詰める。**
`scripts/003_kiro/1-1_コース紹介.txt` の冒頭1ページ（page1）で比較サンプルを作成した。

話者は特に断りがなければ四国めたん ノーマル（speaker=2、既存2コースと同じ）。
前回の `_quality_test/` は削除していない。

## まずこの2つを聴いてください

1. **`center_speed1.2_int0.7_pitch0.03_pause0.8.wav`**
   speed=1.2 / intonation=0.7 / pitch=0.03 / pause=0.8 / pre,post=0.05
   標準的な「速め・平坦め」案。ゆっくり霊夢方向に寄せつつ、聞き取りやすさも残した中庸案。
2. **`extreme_speed1.35_int0.6_pitch0.05_pause0.7.wav`**
   speed=1.35 / intonation=0.6 / pitch=0.05 / pause=0.7 / pre,post=0.03
   ゆっくり霊夢によりはっきり寄せた強めの案。テンポよく畳みかける・間が詰まった印象。

**どちらが好みに近いか、また「もっと」「やりすぎ」のどちら側かを教えてください。**
その中間・外側でさらに調整します。

## 軸ごとの比較（上記1つを基準に、1軸だけ動かした版）

`center`（speed1.2 / int0.7 / pitch0.03 / pause0.8）を基準に、
どのパラメータがどう聞こえに効くかを1軸ずつ確認できます。

| ファイル | 変えた軸 | 値 | 基準との違い |
| --- | --- | --- | --- |
| `speed1.1_int0.7_pitch0.03_pause0.8.wav` | 速度 | 1.1 | centerより少し遅い |
| `center_speed1.2_int0.7_pitch0.03_pause0.8.wav` | （基準） | 1.2 | - |
| `speed1.3_int0.7_pitch0.03_pause0.8.wav` | 速度 | 1.3 | centerより速い |
| `speed1.2_int0.6_pitch0.03_pause0.8.wav` | 抑揚 | 0.6 | centerよりさらに平坦 |
| `speed1.2_int1.0_pitch0.03_pause0.8.wav` | 抑揚 | 1.0（無加工） | centerより自然な抑揚（比較用） |
| `speed1.2_int0.7_pitch0.03_pause1.0.wav` | 間 | 1.0（無加工） | centerより間が詰まっていない（比較用） |

speed 1.1→1.2→1.3 の3段階で聴き比べると、速度単体の効き方がわかる。
intonation・pause は逆側（0.6と1.0/1.0など）との対比で、下げた効果がわかる構成にした。

## 話者の再検討

「ゆっくり霊夢」の質感（速い・平坦・機械的）に近づけられるか、
四国めたん以外／別スタイルも試した。パラメータは `center` と同じ。

| ファイル | 話者 | 所感 |
| --- | --- | --- |
| `speaker6_tsuntsun_speed1.2_int0.7_pitch0.03_pause0.8.wav` | 四国めたん ツンツン（id=6） | 同じキャラのまま口調だけ変わる。地の文の読み上げにはやや強すぎる可能性あり |
| `speaker9_namineritsu_speed1.2_int0.7_pitch0.03_pause0.8.wav` | 波音リツ ノーマル（id=9） | 声質がはっきり違う。クリアで機械的な印象があり、方向性としては合う可能性 |

**判断は保留**（実際に聴いて判断してください）。
参考までに、話者を変える場合のコスト:

- 既存2コース（`audio/003_kiro/` 全13レッスン、`audio/001_cicd/` 生成中ぶん）を作り直す必要がある。
- 動画の口の同期等は無いため映像側の作り直しは不要。音声のみの再生成（VOICEVOXへのAPI呼び出し）で済む。
- 003_kiroは動画完成済みのため、音声を差し替えると動画も再生成が必要（現状の完成品を破棄することになる）。
- 001_cicdは生成中のため、途中から話者を変えても手戻りは比較的小さい。
- 結論: **もし話者を変えるなら、001_cicd（生成中）以降の新規コースからにして、003_kiroは四国めたんのまま公開するのが手戻り最小**。

## 誤読対策（辞書登録・確認済み）

前回見つかった4件を `POST /user_dict_word` で実際に登録し、
`GET /audio_query` のkana出力で読みが直ったことを確認した。

| 用語 | 登録前 | 登録後 |
| --- | --- | --- |
| `npm` | ンプ | エヌピーエム |
| `Q2` | キュウツウ | キューニ |
| `VS Code` | バーサスコード | ブイエス／コード |
| `Hooks` | （文脈依存）エイチウックス | フックス（文脈によらず安定） |

**ハマった点**: `VS Code`という「スペースを含む複合語」でそのまま辞書登録すると、
`VSCode`（スペース無し）は直るが `VS Code`（スペース有り）は直らなかった
（スペースがトークン境界になり、複合語として一致しない）。
実際の台本は基本「VS Code」とスペース区切りで書かれるため、
**`VS`単体を「ブイエス」として登録し直して解決**した
（`Code`単体は元から「コード」と正しく読めていたため、登録不要）。

最終的な辞書は4件（`npm` / `Q2` / `VS` / `Hooks`）。
`user_dict.json`（`GET /user_dict`の出力）をこのディレクトリに同梱。

### 速度を上げたことによる新たな誤読

`misread_dict_registered_speed1.2.wav`（center速度）・
`misread_dict_registered_speed1.35.wav`（extreme速度）の両方で、
4件とも辞書登録後は正しく読まれることをkana出力で確認済み。
**速度を上げたことによる新規の誤読は、この4件の範囲では確認されなかった。**
（テキストは `npmでパッケージをインストールします。Q1、Q2、Q3のふりかえりを行います。VS Codeの拡張機能を使います。SteeringとHooksを使います。Hooksを使います。`）

ただし辞書登録による効果の検証は「読み（kana）が正しいか」で行ったもので、
音質・自然さそのものは実際に聴いて確認してください。

## ファイル一覧（全体）

- `center_speed1.2_int0.7_pitch0.03_pause0.8.wav` … 推奨1
- `extreme_speed1.35_int0.6_pitch0.05_pause0.7.wav` … 推奨2
- `speed1.1_int0.7_pitch0.03_pause0.8.wav` … 速度sweep（低）
- `speed1.3_int0.7_pitch0.03_pause0.8.wav` … 速度sweep（高）
- `speed1.2_int0.6_pitch0.03_pause0.8.wav` … 抑揚sweep（より平坦）
- `speed1.2_int1.0_pitch0.03_pause0.8.wav` … 抑揚sweep（無加工/比較用）
- `speed1.2_int0.7_pitch0.03_pause1.0.wav` … 間sweep（無加工/比較用）
- `speaker6_tsuntsun_speed1.2_int0.7_pitch0.03_pause0.8.wav` … 話者候補1
- `speaker9_namineritsu_speed1.2_int0.7_pitch0.03_pause0.8.wav` … 話者候補2
- `misread_dict_registered_speed1.2.wav` … 誤読確認（center速度・辞書登録後）
- `misread_dict_registered_speed1.35.wav` … 誤読確認（extreme速度・辞書登録後）
- `user_dict.json` … 登録した辞書のエクスポート（`GET /user_dict`）

## 変更していないもの

- `audio/003_kiro/`、`audio/001_cicd/` の既存音声は無加工。
- 既存2コースの再生成はしていない。
- `generate_slide_audio.py` の既定値は変更なし。
- `audio/_quality_test/`（前回分）は削除していない。
