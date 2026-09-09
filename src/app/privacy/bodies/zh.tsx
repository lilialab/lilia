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

export function PrivacyPolicyZh() {
  return (
    <PolicyArticle
      lang="zh-CN"
      updated="最后更新：2026年9月9日"
      intro="我们把你的对话视为私密内容。我们只保留 LILIA 运行所需的信息，不会出售你的信息，也不会用于广告。本页说明我们存储什么、如何保护、谁协助处理，以及删除账号时会发生什么。"
    >
      <PrivacySection title="我们是谁">
        <p>LILIA 是一款带长期记忆的聊天应用，由一个人运营。</p>
        <p>
          联系：{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={cn('text-primary underline')}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </PrivacySection>

      <PrivacySection title="我们收集什么">
        <p>当你注册并使用 LILIA 时，我们会存储：</p>
        <ul className={listClass}>
          <li>账号数据：用户名、昵称、密码哈希（不是密码本身）、语言偏好、时区</li>
          <li>你填写的可选 LLM 设置（API Base URL、模型名、API Key）。密钥会加密存储</li>
          <li>你的聊天消息，包括单聊和群聊</li>
          <li>从这些聊天中提取的记忆（简短事实与事件），以及我们为你与每个 AI 角色生成的画像</li>
          <li>这些记忆的向量嵌入，用于在之后的对话中召回</li>
          <li>登录 Cookie，用于保持登录状态</li>
        </ul>
        <p>为保持服务稳定，我们也会短暂处理：</p>
        <ul className={listClass}>
          <li>你的 IP 地址，用于限制滥用注册和登录</li>
          <li>
            后台任务记录，用于标识哪段聊天需要做记忆处理（用户 id 与会话 id，不含完整消息正文）
          </li>
          <li>
            运行日志，例如错误。我们不会记录完整聊天记录。错误日志仍可能包含用户名、请求路径，或失败请求的一小段内容
          </li>
        </ul>
        <p>
          注册时我们使用 Cloudflare Turnstile 区分人与机器人。Cloudflare
          会收到其验证组件所需的信息。见{' '}
          <ExternalLink href={CLOUDFLARE_PRIVACY}>Cloudflare 的隐私政策</ExternalLink>。
        </p>
      </PrivacySection>

      <PrivacySection title="我们如何使用">
        <ul className={listClass}>
          <li>运行产品：登录、存储聊天、展示通讯录和群聊</li>
          <li>
            让每个 AI
            角色记住你：我们把近期聊天文本发给语言模型，用于提取记忆、生成嵌入、定期维护，并生成画像
          </li>
          <li>保持服务稳定：限流、错误日志、防止滥用</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="我们如何保护">
        <ul className={listClass}>
          <li>密码以哈希形式存储。我们从不保存密码本身</li>
          <li>若你填写自己的 LLM API Key，我们会加密存储</li>
          <li>登录 Cookie 为 HTTP-only，页面脚本无法读取</li>
          <li>我们不使用广告 SDK 或第三方分析</li>
          <li>我们不出售你的信息</li>
          <li>我们不用你的聊天来训练 LILIA 模型</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="存储位置与谁会看到">
        <p>
          <span className={cn('font-medium text-foreground')}>我们的服务器。</span>
          你的账号、聊天、记忆和嵌入存放在我们位于日本东京运营的服务器上。若该位置变更，我们会更新本页。
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>默认语言模型与嵌入。</span>
          聊天回复（除非你设置了自己的
          API）、记忆提取、记忆维护、画像生成和嵌入会发送给硅基流动（SiliconFlow），一家总部位于中国的公司。我们目前使用他们托管的
          DeepSeek 模型。SiliconFlow 会收到我们发送的文本以便运行模型。该处理适用{' '}
          <ExternalLink href={SILICONFLOW_PRIVACY}>SiliconFlow 的隐私政策</ExternalLink>。
        </p>
        <p>
          <span className={cn('font-medium text-foreground')}>你自己的 LLM API。</span>
          若你保存了自己的 OpenAI 兼容 Base URL、API Key
          和模型，聊天回复会发往该接口，而不走我们的默认服务。记忆提取、嵌入及相关后台任务仍使用
          SiliconFlow，因此这些文本仍会发往那里。
        </p>
      </PrivacySection>

      <PrivacySection title="保留多久">
        <p>在你删除账号之前，我们会保留你的账号、聊天、记忆、嵌入和画像。</p>
        <p>登录 Cookie 会在有限期后过期。</p>
        <p>限流记录和后台任务记录是短期的，到期或完成后会删除。</p>
      </PrivacySection>

      <PrivacySection title="你可以做什么">
        <ul className={listClass}>
          <li>登录后可修改昵称、密码、语言和 LLM API 设置</li>
          <li>
            在设置中删除账号。这将永久删除我们系统中你的账号、聊天、记忆、画像、登录会话和已存储的向量
          </li>
          <li>若有未删除且我们仍能在服务器上访问到的内容，可发邮件给我们，我们会删除</li>
        </ul>
        <p>
          已发送给 SiliconFlow（或你自己的 LLM
          提供商）的文本，按其隐私政策处理。我们无法删除他们系统上的副本。
        </p>
        <p>
          应用内尚不支持导出你的全部数据。若你需要一份副本，请发邮件给我们，我们会在合理范围内协助。
        </p>
      </PrivacySection>

      <PrivacySection title="Cookie">
        <p>
          我们设置一枚第一方 Cookie：用于保持登录的 HTTP-only 会话 Cookie。生产环境会标记为 Secure。
        </p>
        <p>注册时 Cloudflare Turnstile 可能会设置自己的 Cookie。</p>
      </PrivacySection>

      <PrivacySection title="儿童">
        <p>LILIA 不面向 13 岁以下儿童。未满 13 岁请勿注册账号。</p>
      </PrivacySection>

      <PrivacySection title="国际用户">
        <p>
          若你在日本以外使用 LILIA，你的账号数据仍存储在日本，用于模型推理的文本由中国的 SiliconFlow
          处理。我们目前不提供区域选择。
        </p>
      </PrivacySection>

      <PrivacySection title="变更">
        <p>
          产品变更时我们会更新本页（例如更换默认模型提供商或服务器所在地）。页顶日期为最近一次更新。
        </p>
      </PrivacySection>
    </PolicyArticle>
  );
}
