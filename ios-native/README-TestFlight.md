# PIKOPIA — TestFlight 配布手順 / 2026-10-25

## 実装・未実施の区別
- 完了: iOS SwiftUI + WKWebView ラッパー、6種ゲームファイル同梱、XcodeGenプロジェクト定義、1024pxアイコン、PrivacyInfo.xcprivacy、Mac向けArchive手順、GitHub macos-26ビルド検証ワークフロー。
- 未実施: Xcode 26での実際のコンパイル、実機画面・音声の動作検証、App Store ConnectのPIKOPIA新規アプリ登録、Apple証明書/署名の実行、TestFlightアップロード、オンラインFirebase接続。
- 既存の別アプリの Bundle ID を流用・上書きしません。

## まず Apple 側で必要な作業（本人のAppleアカウント）
1. https://developer.apple.com/account/resources/identifiers/list にアクセスして Identifiers → + → App IDs → App。Bundle ID `com.yosiken0421.pikopia` を正確に登録。まだ未使用であることを要確認。
2. https://appstoreconnect.apple.com/apps を開いて My Apps → + → 新規App。プラットフォーム iOS、名前 `PIKOPIA`（重複する場合は独自名）、プライマリ言語 日本語、Bundle ID 上記選択、SKU `pikopia20261025ios`（未使用の値に変更しても可）。
3. Apple Developer Program会員であることを確認。既存のアプリと別のApp Recordとして作成する。

## Macでの実行（Xcode 26+）
1. Xcode と XcodeGen をインストール（例: `brew install xcodegen`）。
2. この配布フォルダで `./ios-native/scripts/build-simulator.sh` を実行（シミュレータ用ビルド）。
3. `cd ios-native && ./scripts/prepare-mac.sh && open PIKOPIA.xcodeproj` で Xcode を開いて、Target PIKOPIA → Signing & Capabilities → Team にApple Developerチームを選択。
4. 実機でゲーム操作、BGM、WebKit内localStorageの永続性、画面セーフエリア、各種難易度を検証。
5. `APPLE_TEAM_ID=<実際のTeam ID> ./ios-native/scripts/archive-and-upload-mac.sh` を実行すると、Archiveまで試み、Xcode Organizerで配布ダイアログが開く。
6. Organizerで Distribute App → TestFlight & App Store → Upload。Apple側の処理完了後、App Store Connect → PIKOPIA → TestFlight → 内部テスターグループにビルドを割り当てる。

## GitHub Actions（Macがない場合のビルド確認）
`.github/workflows/pikopia-ios-build.yml` をPIKOPIA専用リポジトリにpushしたあと、Actions → PIKOPIA iOS simulator build → Run workflow を実行すると macos-26 環境で署名なしシミュレータビルドを試行します。
**このワークフローはTestFlightへアップロードしません。** TestFlightには Apple署名済み iPhoneOS ビルドのアーカイブ・アップロードが必要です。GitHub Actionsの秘密情報に証明書・プロビジョニングを設定して自動配信する拡張、またはMac上でArchive・Uploadが必要です。

## 注意点
- Appleは2026年4月28日以降のアップロードについてXcode 26以降とiOS 26 SDKを必須としています。
- iOSラッパーは Capacitorとは別の代替で、ネイティブSwiftUI/WKWebViewの軽量実装です。既存のWebゲームのJSを表示する方式です。iPhone実機テスト前の品質保証は未完了です。
- オンライン対戦機能はFirebase設定なしでは未接続です。審査時にアプリの実際の状態が分かる説明を用意してください。
- `www`は静的ファイルとしてバンドル同梱されています。Swiftコードはアクセス権限を追加で要求しません。
- このフォルダの `project.yml` とアプリ名・Bundle ID は仮の識別情報を含みます。Appleで同じBundle IDを登録した後は他アプリのIDと混同しないでください。

## Mac無しで Codemagic から TestFlight へ送る（おすすめ）
同梱 `codemagic.yaml` は、本人のCodemagicアカウントに接続した後にApple署名付きIPAを作り、App Store Connectへアップロードするための構成です。**現時点ではビルドもアップロードも実行されていません。**

1. Apple Developerで明示的App ID `com.yosiken0421.pikopia` を登録し、App Store ConnectでPIKOPIAの新規アプリレコードを作成する。
2. PIKOPIA専用のGitHubリポジトリに、このZIPの `pikopia-app/` 内の内容を**ルート**としてコミットする（`codemagic.yaml` がルート直下になること）。既存アプリのリポジトリに上書きしない。
3. https://codemagic.io/apps からAdd applicationでそのリポジトリを追加する。
4. 既存のApple Developer Portal連携が使えるなら、その連携キーの表示名を Codemagic の保護された環境変数グループ `pikopia-apple` の `ASC_KEY_ALIAS` に登録する。Appleの秘密鍵自体をGitHubに保存しない。必要であればCodemagicでApple連携を新規追加する。
5. CodemagicのCode signing identitiesに、このアプリID用App Store ConnectのProvisioning Profileと、対応する有効なApple Distribution署名証明書を登録する。別アプリのProvisioning Profileでは署名できません。
6. PIKOPIAの `pikopia-testflight-internal` ワークフローを手動で実行。署名・アップロードに成功したら、App Store Connect → PIKOPIA → TestFlightの内部テスターグループに追加する。

このワークフローは**内部テスト専用**で、外部テスト審査への自動提出やApp Store公開は行いません。Appleの処理が完了してからTestFlightで配布されます。Codemagic利用料金はそのアカウントのプランとビルド時間によります。

参考: https://docs.codemagic.io/yaml-quick-start/building-a-native-ios-app/ , https://docs.codemagic.io/yaml-publishing/app-store-connect/
