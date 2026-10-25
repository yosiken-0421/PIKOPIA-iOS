# PIKOPIA — オリジナル・ミニゲーム集 試遊版

制作日: 2026-10-25 / version 0.1.1 / 仮称: PIKOPIA

## 0.1.1 キャラクター統一アップデート

- キービジュアルのピコ・ミント・モヤを実際の6種類のミニゲーム選択カード、導入、プレイ中、結果画面に表示。
- コメット・ダッシュの操作キャラクターをミントに変更。
- Web版とiOSネイティブ同梱の両方を修正。既存のTestFlightに反映するには新しい署名済みビルドのアップロードが必要です。

## 現在できること

- 6つのミニゲーム（ピタッとキャッチ・きらきらタッチ・おとまねパレット・すうじポン！・いろの灯台・コメット・ダッシュ）
- ランダムで3/5/6ゲームを重複なく抽選。すべて独自実装。
- 3段階の難易度
- 同じスマホで2人が同じゲーム構成・同じ乱数シードで順番にプレイして対戦
- 各ゲーム100点・合計点・端末内ランキング（localStorage、ゲームあたりの平均得点順）
- アプリ用ホーム画面アイコン、PWA、オリジナルのキャラクター絵（SVG）、独自のシンセサウンド・音楽ループ・端末の読み上げ（任意）
- **Firebaseを構成した後に利用できる、招待コード付き非同期オンラインスコア対戦（追加コード同梱）**

## まだできないこと・確認されていないこと

- 配布したままでは**オンライン対戦は未接続**。Firebaseのプロジェクト・匿名認証・Firestore・アクセスルールが必要。
- 世界ランキング・友達ランキングの同期は未実装（端末内記録のみ）。同時進行のリアルタイムPvPではない。
- サーバー側でのプレイ内容検証・不正防止、アクセシビリティ実機テスト、ストア審査、実機複数端末テストは未実施。
- 子供向けのストア公開前に年齢設計、プライバシーポリシー、情報管理、保護者向け説明、リスクと各ストアの年齢要件対応が必要。
- `appId`（app.pikopia.minigame）や「PIKOPIA」名称は仮設定。公開前に名称と商標等を要調査。

## PCで見る（最短）

Pythonがある場合：

```sh
cd pikopia-app/www
python -m http.server 8080
```

ブラウザで `http://localhost:8080/` を開きます。Wi-Fi内の他端末からアクセスする場合はPCのLANアドレスを使用し、公開ネットワークには無防備に晒さないでください。

## iPhone / Android からアプリ風に利用

1. `www` の中身を GitHub Pages などHTTPS配信できる静的ホスティングにアップロード（`index.html` が公開先直下にある必要あり）。
2. iPhone: Safariの共有メニュー →「ホーム画面に追加」。Android: Chromeのメニュー →「アプリをインストール」または「ホーム画面に追加」。
3. PWAは**ホーム画面から起動するWebアプリ**であり、App Store / Google Playに登録されたネイティブアプリではありません。

## 本物のiPhone / Android ストアアプリに変える

Capacitor 8 の公式フローを想定。Node 22以降、AndroidはAndroid Studio、iOSはmacOSのXcodeが必要。

```sh
cd pikopia-app
npm install
npx cap add android
npx cap sync android
npx cap open android
```

iOS (macOS + Xcode):

```sh
npx cap add ios
npx cap sync ios
npx cap open ios
```

- Android: Android Studioで実機/エミュレーター確認し、署名済みAABをビルド。Google Play Console登録が必要（$25初回登録、アカウントによってテスト条件あり）。
- iOS: Xcodeで実機起動し、Archive・App Store Connectへ配布。Apple Developer Programは通常$99/年（地域により表示通貨は異なる）。
- このプロトタイプをそのまま審査に提出して承認される保証はなく、品質、表示、プライバシー、反コピー規定等に対応してから審査申請します。

## Firebaseオンライン試験接続（開発者向け）

1. <https://console.firebase.google.com/> で独立したFirebaseプロジェクトを作る。
2. Authentication → Sign-in method → **匿名（Anonymous）** 認証を有効化。
3. Firestore Database を作成（Standard、利用したいリージョンを選択）。**テストモードの公開ルールは使わないこと。**
4. Firestore → Rules に同梱の `firestore.rules` を貼り付け、公開。
5. プロジェクト設定 → マイアプリ → ウェブアプリ登録 → 設定オブジェクト（`apiKey`, `authDomain`, `projectId`, `appId` など）を取得し、`www/firebase-config.js` の `window.PIKOPIA_FIREBASE_CONFIG` に設定する。
6. 変更版をHTTPSで配信し、2台の異なる端末で開きます。1台目で「部屋を作る」→8文字のコードを2台目に送る→2台目で参加→双方が同一のランダム抽選ゲームをそれぞれプレイ→結果を照合。**ゲームのリアルタイム同時操作ではなく、同じゲームセットをプレイして得点比較します。**

**安全上の注意:** 招待コードは公開しないでください。登録名には個人情報を使わないでください。対戦得点をクライアントが送る試作方式であり、悪意ある改ざんへの強い耐性はありません。一般公開前はサーバー側検証、レート制限、ルームの期限・削除、モデレーション/年齢設計、プライバシーポリシーを追加してください。現行ルールはルームの作成、参加、成績送信を本人に制限しますが、それだけで商用対戦用に十分ではありません。

## オリジナル制作・権利について

- キャラクター「ピコ」は独自に作図した多角形の空飛ぶプリズム型マスコット。コード中の SVG と `make_assets.py` で制作。世界観キービジュアルにはピコ・ミント・モヤを描いた新規生成のオリジナルイラストを使用。
- BGM `www/assets/bgm-pikopia.wav` は独自の音列をPythonで合成。BGMと効果音に外部楽曲・既存音源は利用していません。
- 日本語読み上げはブラウザ/OSのSpeech Synthesisであり、端末によって声質、動作、利用可能性が異なります。録音済み音声は同梱していません。
- 既存作の画像、名称、UI素材、ゲームデータ、音楽、キャラクターは複製していません。一般的なルールや操作の発想を独自表現で再構成しています。ただし最終的な法的非侵害は保証できません。公開前に商標・意匠・著作権等の調査を行ってください。

## 参考公式サイト (2026-10-25 調査)

- Nintendo WarioWare Move It: https://www.nintendo.com/us/store/products/warioware-move-it-118742/
- Nintendo Super Mario Party Jamboree: https://play.nintendo.com/news-tips/game-releases/super-mario-party-jamboree-now-available/
- Dumb Ways to Die: https://www.dumbwaystodie.com/games
- Apple App Review Guidelines: https://developer.apple.com/jp/app-store/review/guidelines/
- Apple Developer Program: https://developer.apple.com/programs
- Google Play setup: https://support.google.com/googleplay/android-developer/answer/6112435
- Google closed testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Firebase pricing: https://firebase.google.com/docs/firestore/pricing
- Capacitor: https://capacitorjs.com/docs
- 日本文化庁 FAQ: https://www.bunka.go.jp/seisaku/chosakuken/kaizoku/faq.html

## v0.2.0 — ミニゲーム刷新（2026-10-26）
- 従来6種類に加え、ふうせんファクトリー／リズム・スター／まほうの天秤／星あかりの迷路を追加。**合計10種類**。
- 反射神経だけではなく、タイミング・記憶・逆ルール・危険回避・計算・迷路の判断を楽しむ設計。
- ランダム抽選は3/5/10種類から選択可能。3段階の難易度を保持。
- Web本体とiOS同梱Web本体の双方を更新済み。v0.2.0 (build 3)に設定。
- 別途組み立てたブラウザー用試作品で10ゲーム起動・迷路の道生成/クリア・3ゲーム完走/2人モード遷移を自動チェック。
- **TestFlightは未更新**。署名済みiOS Archiveの生成とApp Store Connectへのアップロードが別途必要です。
- 実機タッチ操作、ストア審査、オンライン同期、商用バランス調整は未完了です。
