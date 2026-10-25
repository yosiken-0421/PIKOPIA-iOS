# PIKOPIA — 2026-10-25 作業状態

## 完了（ローカルで検証）
- 添付ZIPの解析。ゲーム6種類、画像、BGM、iOSラッパーを確認。
- ゲーム別平均点によるランキングの比較式を修正。
- タイミング、星、色ゲームの達成後の追加タップを無効化。
- 記憶ゲームのミス減点が正解時に消える問題を修正。
- WKWebViewのネイティブダイアログ委譲に依存しないHTML dialogで、2人目の名前入力と記録削除の確認を実装。
- 背景移行時はプレイ中のラウンドを開始前に戻し、音声とタイマーを停止。
- 未完成のオンライン対戦を無効化。Firebase設定スクリプトは今回読み込まない。
- Service Workerの同一オリジン判定とキャッシュ削除範囲を修正。
- iOSビルド時に正本のwwwを自動コピーし、二重管理による食い違いを防止。
- 署名済みアーカイブをApp Store Connectへアップロードする手動実行用Actionsを追加。
- 13項目のNodeロジックテストがすべて成功。最初のテストで6ゲーム×3難易度を確認。

## 実際に確認した外部状態（今回更新）
- Apple作業用ブラウザーへのログイン成功を確認。
- Team ID: 429AWBTA7B。
- Apple DeveloperでPIKOPIA専用の明示的Bundle ID com.yosiken0421.pikopiaを新規作成し、一覧への反映を確認。
- App Store ConnectでPIKOPIAを新規登録。SKU pikopia001 / 日本語 / iOS。
- App Store Connect App ID: 6826824653。
- TestFlightにPIKOPIA Internalという内部グループを作成。0人のテスター・0個のビルドを確認。
- TestFlightグループは自動配信を有効にして作成。
- TestFlight URL: https://appstoreconnect.apple.com/teams/6aa1f3ba-8818-4964-b0fc-aad8f75dd2ab/apps/6826824653/testflight
- Apple Developer契約の更新同意を求めるバナーあり。本人が内容を確認して同意する必要がある。代理で同意していない。
- GitHub連携のユーザーは yosiken-0421。取得したリポジトリ一覧にPIKOPIA専用はない。
- ユーザーがPIKOPIA-iOSを作成。GitHub APIで非公開・管理権限・main初期コミットを確認。
- 専用リポジトリ: https://github.com/yosiken-0421/PIKOPIA-iOS
- 費用枠を確認するまでActionsは手動実行のみ。
- GitHubへのGoogle認証利用とApple再試行はユーザーが「両方許可」と明示許可済み。再確認不要。
- 既存AtodeYaruBox-iOSの現行ios.ymlは署名なしビルド設定で、配布用署名キーの再利用は確認できていない。

## 未完了
GitHub専用リポジトリ作成・ソース保存、署名資材とビルド環境の確認、macOSビルド、IPA署名、アップロード、内部テスター登録、Apple処理完了確認、iPhone実機インストール。
このZIPはソースコードで、IPAやインストール可能アプリではない。

## 安全性・費用
他アプリのファイル、Apple証明書、TestFlightビルドは変更していない。
追加契約、課金、クラウドビルドの起動は行っていない。
秘密情報は同梱していない。既存証明書の失効・再作成は行わない。

## ビルド構成
今回の添付ZIPにはCapacitorの依存設定に加えて独立したSwiftUI/WKWebViewラッパーがある。
配布用Actionsは既存のios-nativeラッパーを使用し、Capacitor生成プロジェクトは使用しない。
Bundle ID: com.yosiken0421.pikopia / version: 0.1.0 / 最低iOS: 17.0。
手動署名スクリプトは実際のmacOSビルド未実施。利用可能な既存署名環境を確認してから調整・実行する。

## 続行するChatGPTへの指示
ユーザーの目標はTestFlightにPIKOPIAを表示し、実機で遊べること。準備だけで完了扱いにしない。
Apple再試行とGitHubのGoogle認証への明示許可は取得済み。ユーザー自身でログインする希望を優先する。
新規リポジトリは専用のPIKOPIA-iOSを候補にし、既存アプリには混ぜない。
費用優先でもソースの公開範囲は勝手に広げず、私有リポジトリなら含まれる無料分・支出設定を確認してから実行する。
署名資材は内容を表示せずに対象Bundle ID・Team・期限を確認する。Secretsをコードへ書かない。
Apple処理が終わり、内部テスターに配布されインストール可能であることを実状態で検証する。
