# PIKOPIA TestFlight 成功手順・障害復旧メモ

最終確認：2026-10-26（JST）。
対象リポジトリ：`yosiken-0421/PIKOPIA-iOS`。
Bundle ID：`com.yosiken0421.pikopia`。
バージョン：`0.3.0`、成功したビルド番号：`1003`。
**このファイルは手順書のみ。秘密鍵・Key ID・Team ID・Issuer IDの実値、メールアドレス、証明書は記載しない。**

## 確認できた成功

- GitHub Actions: `PIKOPIA cloud-signed TestFlight upload` / `pikopia-cloud-testflight.yml`
- 実際の成功 Run: https://github.com/yosiken-0421/PIKOPIA-iOS/actions/runs/40232328719 （3回目の試行）
- テスト13/13成功、`ARCHIVE SUCCEEDED`、`Upload succeeded`、`EXPORT SUCCEEDED`、Actions job成功。
- ユーザーはApp Store ConnectのTestFlightビルド表示、テスター登録、iPhoneでのアップデート・ゲームの実プレイ成功を確認した。

## 再アップロード時の基本手順（優先）

1. `.github/workflows/pikopia-cloud-testflight.yml` を使用する。**旧** `pikopia-testflight.yml`（手動P12 + mobileprovisionが必要）と混同しない。
2. `main` の変更内容を確認してから、GitHub Actions の `PIKOPIA cloud-signed TestFlight upload` を `Run workflow` で実行する。GitHub Actions write権限がある場合はコネクタ経由で再実行できる。
3. このワークフローは GitHub environment `pikopia-testflight` 内の次の4シークレットを使う：
   - `APPLE_TEAM_ID`
   - `ASC_KEY_ID`
   - `ASC_ISSUER_ID`
   - `ASC_PRIVATE_KEY`
4. 生成元スクリプトは `ios-native/scripts/ci-testflight-cloud.sh`。XcodeGenでプロジェクトを生成し、Apple APIキーを使って自動署名・アーカイブ・App Store Connectアップロードを実行する。P12・手動プロビジョニング情報の3つの追加Secretsは通常この経路では不要。
5. GitHub Actions成功後はAppleの処理待ちがあり得る。App Store Connect > PIKOPIA > TestFlight に対象の最新ビルドが現れ、テスターが利用可能かを別途確認する。GitHubが緑でも、TestFlightで利用できるとは限らない。
6. iPhoneのTestFlightでアップデート/インストールし、ゲームをプレイして実機確認する。

## 実際に遭遇した障害と直し方

### A. `Missing required signing setting: APPLE_TEAM_ID`

旧 `PIKOPIA signed TestFlight upload` 実行時に7個のApple設定が未登録だった。
対策：まず正しい GitHub environment (`pikopia-testflight`) にSecretsがあるか確認。現行の**クラウド署名経路**は上記4つのみを必要とする。ワークフローがSecretsを読み込んでいるかログで確認。秘密値をログに出力しない。

### B. `CryptoKitASN1Error.invalidPEMDocument` または `Invalid ASC_PRIVATE_KEY: missing BEGIN/END PRIVATE KEY markers`

App Store Connect APIの `.p8` 秘密鍵の登録値が違う/欠落/改行崩れ。
対策：対応する `AuthKey_*.p8` の **中身全体**（`-----BEGIN PRIVATE KEY-----` から `-----END PRIVATE KEY-----` まで）をGitHub environment secret `ASC_PRIVATE_KEY` に入れ、同じキーのKey IDを `ASC_KEY_ID` に設定。`ci-testflight-cloud.sh` は改行の補正・PEM検証を行う。**秘密鍵の中身はチャットや公開リポジトリに貼らない**。Appleの `.p8` は通常再ダウンロード不可。

### C. `Cloud signing permission error` / `No profiles for 'com.yosiken0421.pikopia' were found`

最初のApp Manager権限のAPIキーを用いたとき、`ARCHIVE SUCCEEDED` まで成功したが `EXPORT FAILED` となった。
対策：Appleチームのクラウド管理証明書へのアクセスと、APIキーの権限を確認する。この環境で**実際に成功したのは「管理者（Admin）」権限の新しいTeam APIキー**に `ASC_KEY_ID` と `ASC_PRIVATE_KEY` を更新した後だった。`APPLE_TEAM_ID` と `ASC_ISSUER_ID` は同じAppleチームだったため変更不要だった。
注意：Adminキーは強い権限を持つ。可能ならAppleの正式な権限管理/監査に従って最小権限に移行する。不要なキーを闇雲に作成・失効させない。

### D. GitHub Actions成功だがTestFlightに表示されない

`Upload succeeded` 直後にはApple側が `Uploaded package is processing` の状態になる。
対策：App Store Connect側でアプリのビルド処理状況/検証エラーを確認。新規のビルド番号が必要な場合は `github.run_number` ベースの番号を確認し、過去と重複しないようにする。

## 注意点

- 秘密鍵はGitHub **Environment secrets** に登録し、公開レポジトリのコード・コミットには含めない。チャットやスクショでも公開しない。
- Xcodeのビルドが成功してもApp Store Connectへのアップロードは別ステップ。必ずログとApple側の状況の両方を見る。
- 2026-10-26時点、`pikopia-cloud-testflight.yml` は手動起動。コードの変更を自動でTestFlightに公開するとは限らない。
- GitHub側の再実行は既存runと同じコミットSHAを使う。コードが更新されていたら**新しいワークフローRun**を起動すること。
- iPhoneでのテスト成功はApp Store一般公開を意味しない。一般公開には別途審査・手続きが必要。

## 参考リンク

- 成功したActions: https://github.com/yosiken-0421/PIKOPIA-iOS/actions/runs/40232328719
- 実行画面: https://github.com/yosiken-0421/PIKOPIA-iOS/actions/workflows/pikopia-cloud-testflight.yml
- Secrets設定: https://github.com/yosiken-0421/PIKOPIA-iOS/settings/environments
- App Store Connect: https://appstoreconnect.apple.com/apps

次のチャットでの指示例：「PIKOPIAのTestFlight配信作業を続けて。まずGitHubの`TESTFLIGHT_RECOVERY.md`を読み、成功手順と最新のActionsログを参照して、作業できるところを自律的に進めて。スクショ不要、秘密鍵は求めない。」
