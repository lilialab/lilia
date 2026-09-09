import { cn } from '@/lib/client/cn';
import {
  CLOUDFLARE_PRIVACY,
  CONTACT_EMAIL,
  ExternalLink,
  listClass,
  PolicyArticle,
  PrivacySection,
  SILICONFLOW_PRIVACY,
} from '../policy-markup';

export function PrivacyPolicyJa() {
  return (
    <PolicyArticle
      lang="ja"
      updated="最終更新：2026年9月9日"
      intro="私たちはあなたのチャットを私的なものと扱います。LILIA の運営に必要な情報だけを保持し、販売せず、広告にも使いません。このページでは、何を保存するか、どのように守るか、誰が処理を手伝うか、アカウント削除時に何が起きるかを説明します。"
    >
      <PrivacySection title="運営者">
        <p>LILIA は長期記憶付きのチャットアプリで、一人で運営しています。</p>
        <p>
          連絡先：{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={cn('text-primary underline')}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </PrivacySection>

      <PrivacySection title="収集する情報">
        <p>アカウント作成と LILIA の利用にあたり、次を保存します。</p>
        <ul className={listClass}>
          <li>
            アカウント情報：ユーザー名、ニックネーム、パスワードのハッシュ（パスワード自体ではない）、言語設定、タイムゾーン
          </li>
          <li>
            任意で入力する LLM 設定（API の Base URL、モデル名、API
            キー）。キーは暗号化して保存します
          </li>
          <li>チャットメッセージ（1対1およびグループ）</li>
          <li>
            それらのチャットから抽出した記憶（短い事実や出来事）、および各 AI
            キャラクターごとに生成するプロフィール
          </li>
          <li>それらの記憶のベクトル埋め込み（後の会話で思い出すため）</li>
          <li>ログイン状態を保つためのログイン Cookie</li>
        </ul>
        <p>サービスを安定して動かすため、次も短時間処理します。</p>
        <ul className={listClass}>
          <li>IP アドレス（不正な登録・ログインを制限するため）</li>
          <li>
            どのチャットを記憶処理するかを示すバックグラウンドジョブの記録（ユーザー id とセッション
            id。メッセージ本文全体は含みません）
          </li>
          <li>
            エラーなどの運用ログ。チャット全文は記録しません。エラーログにはユーザー名、リクエストパス、失敗したリクエストの短い断片が残ることがあります
          </li>
        </ul>
        <p>
          登録時、人とボットを区別するために Cloudflare Turnstile を使います。Cloudflare
          はそのウィジェットが検証に必要な情報を受け取ります。{' '}
          <ExternalLink href={CLOUDFLARE_PRIVACY}>Cloudflare のプライバシーポリシー</ExternalLink>
          を参照してください。
        </p>
      </PrivacySection>

      <PrivacySection title="利用目的">
        <ul className={listClass}>
          <li>プロダクトの運営：ログイン、チャットの保存、連絡先とグループの表示</li>
          <li>
            各 AI
            キャラクターがあなたを覚えるため：直近のチャット文を言語モデルに送り、記憶の抽出、埋め込み、定期的なメンテナンス、プロフィール作成を行います
          </li>
          <li>サービスの安定：レート制限、エラーログ、不正利用の防止</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="保護の方法">
        <ul className={listClass}>
          <li>パスワードはハッシュとして保存します。パスワード自体は保持しません</li>
          <li>独自の LLM API キーを追加した場合、暗号化して保存します</li>
          <li>ログイン Cookie は HTTP-only で、ページ上のスクリプトからは読めません</li>
          <li>広告 SDK やサードパーティのアナリティクスは使いません</li>
          <li>情報を販売しません</li>
          <li>あなたのチャットで LILIA のモデルを訓練しません</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="保存場所と第三者">
        <p>
          <span className={cn('font-medium text-foreground')}>私たちのサーバー。</span>
          アカウント、チャット、記憶、埋め込みは、日本・東京で私たちが運営するサーバーにあります。場所が変わった場合は、このページを更新します。
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>
            デフォルトの言語モデルと埋め込み。
          </span>
          チャット返信（独自 API
          を設定していない場合）、記憶抽出、記憶メンテナンス、プロフィール生成、埋め込みは、中国に本拠を置く
          SiliconFlow（硅基流动）に送られます。現在は同社がホストする DeepSeek
          モデルを使っています。SiliconFlow
          はモデル実行のために、私たちが送ったテキストを受け取ります。この処理は{' '}
          <ExternalLink href={SILICONFLOW_PRIVACY}>SiliconFlow のプライバシーポリシー</ExternalLink>
          が適用されます。
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>あなた自身の LLM API。</span>
          独自の OpenAI 互換 Base URL、API
          キー、モデルを保存した場合、チャット返信はデフォルトではなくそのエンドポイントに送られます。記憶抽出、埋め込み、関連するバックグラウンドジョブは引き続き
          SiliconFlow を使うため、そのテキストは同社に送られます。
        </p>
      </PrivacySection>

      <PrivacySection title="保管期間">
        <p>
          アカウントを削除するまで、アカウント、チャット、記憶、埋め込み、プロフィールを保管します。
        </p>
        <p>ログイン Cookie は一定期間後に期限切れになります。</p>
        <p>
          レート制限の記録とバックグラウンドジョブの記録は短命で、期限切れまたは完了時に削除されます。
        </p>
      </PrivacySection>

      <PrivacySection title="あなたができること">
        <ul className={listClass}>
          <li>ログイン中にニックネーム、パスワード、言語、LLM API 設定を変更できます</li>
          <li>
            設定からアカウントを削除できます。これにより、私たちのシステムからアカウント、チャット、記憶、プロフィール、ログインセッション、保存済みベクトルが永久に削除されます
          </li>
          <li>
            削除されていないものがあり、私たちがサーバー上でまだアクセスできる場合は、メールしてください。削除します
          </li>
        </ul>
        <p>
          SiliconFlow（またはあなた自身の LLM
          プロバイダ）にすでに送ったテキストは、先方のプライバシーポリシーの下で処理されます。先方のシステム上のコピーは削除できません。
        </p>
        <p>
          アプリ内で全データを書き出す機能はまだありません。コピーが必要な場合はメールしてください。合理的な範囲で対応します。
        </p>
      </PrivacySection>

      <PrivacySection title="Cookie">
        <p>
          ファーストパーティ Cookie は 1 つです。ログイン維持用の HTTP-only セッション Cookie
          で、本番では Secure を付けます。
        </p>
        <p>登録時、Cloudflare Turnstile が独自の Cookie を設定することがあります。</p>
      </PrivacySection>

      <PrivacySection title="子ども">
        <p>
          LILIA は 13 歳未満の子ども向けではありません。13
          歳未満の方はアカウントを作成しないでください。
        </p>
      </PrivacySection>

      <PrivacySection title="国外からの利用">
        <p>
          日本国外から LILIA
          を使う場合も、アカウントデータは日本に保存され、モデル推論のために送ったテキストは中国の
          SiliconFlow が処理します。現在、リージョンの選択は提供していません。
        </p>
      </PrivacySection>

      <PrivacySection title="変更">
        <p>
          プロダクトが変わったとき（デフォルトのモデル提供元やサーバー所在地の変更など）、このページを更新します。先頭の日付が最終更新日です。
        </p>
      </PrivacySection>
    </PolicyArticle>
  );
}
