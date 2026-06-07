# セクション4 レクチャー2: JMeterスクリプトの作成

## 動画情報
- **時間**: 約15分
- **形式**: 画面収録（ハンズオン）

---

## 台本

### JMeterのインストール（0:00-2:00）

JMeterスクリプトを作成するために、
まずJMeterをインストールします。

Apache JMeterの公式サイトにアクセスします。
「Download Releases」から最新版をダウンロードします。

Zipファイルを展開して、
binフォルダ内のjmeter.bat（Windowsの場合）を実行します。

JMeterのGUIが起動しました。

---

### テストプランの作成（2:00-5:00）

新しいテストプランを作成します。

左側のツリーに「Test Plan」が表示されています。
これを右クリックして、
「Add」→「Threads (Users)」→「Thread Group」を選択します。

Thread Groupが追加されました。

Thread Groupの設定を行います。

**Number of Threads (users)**
仮想ユーザー数です。
DLTのConcurrencyと組み合わせて使うので、
ここでは「1」にしておきます。

**Ramp-up period (seconds)**
ユーザーを追加していく時間です。
「1」にします。

**Loop Count**
テストの繰り返し回数です。
「Forever」にチェックを入れます。
実際のテスト時間はDLTのHold For設定で制御します。

---

### HTTPリクエストの追加（5:00-9:00）

Thread Groupを右クリックして、
「Add」→「Sampler」→「HTTP Request」を選択します。

HTTP Requestの設定を行います。

**Server Name or IP**
テスト対象のホスト名です。
「api.example.com」と入力します。
（実際には自分のAPIサーバーを指定）

**Protocol**
「https」を選択します。

**HTTP Request**
メソッドは「GET」を選択します。
パスには「/api/users」と入力します。

これで、https://api.example.com/api/users に
GETリクエストを送るサンプラーができました。

---

### ヘッダーの追加（9:00-12:00）

多くのAPIでは、認証トークンやContent-Typeなどの
ヘッダーが必要です。

Thread Groupを右クリックして、
「Add」→「Config Element」→「HTTP Header Manager」を選択します。

「Add」ボタンをクリックして、ヘッダーを追加します。

**Name**: Content-Type
**Value**: application/json

もう1つ追加します。

**Name**: Authorization
**Value**: Bearer your-token-here

これで、すべてのリクエストに
これらのヘッダーが付与されます。

---

### スクリプトの保存（12:00-15:00）

スクリプトを保存します。

「File」→「Save Test Plan as」を選択します。

ファイル名は「api-load-test.jmx」とします。

これで、JMeterスクリプトの作成が完了しました。

次のレクチャーでは、このスクリプトを
DLTにアップロードして実行します。

---

## 撮影メモ

- JMeterのUI操作を丁寧に
- 各設定項目の意味を説明
- 実際の値を見せながら操作
