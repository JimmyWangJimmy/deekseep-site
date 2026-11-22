/**
 * 站点脚本：从控制面读版本信息，填下载区与版本表。
 * 联系方式改下面的 CONTACT 即可（也可以从 /site/config.json 读，但没必要多一个请求）。
 */
// GitHub Pages 是纯静态托管，接口在控制面上，跨域访问（服务端已开 CORS）
const API_BASE = /github\.io$/.test(location.hostname) || location.protocol === 'file:'
  ? 'https://cool-module-sellers-harris.trycloudflare.com'
  : ''

const CONTACT = {
  wechat: '日月明（扫码加好友）',
  email: 'JimmyWangJimmy@outlook.com',
  hours: '工作日 9:00–18:00',
}

const $ = (id) => document.getElementById(id)
const setText = (id, value) => {
  const el = document.getElementById(id)
  if (el) el.textContent = value
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return Math.round(bytes / 1024) + ' KB'
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function loadReleases() {
  try {
    const response = await fetch(API_BASE + '/api/app/releases', { headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error('HTTP ' + response.status)
    const body = await response.json()
    const releases = Array.isArray(body.releases) ? body.releases : []
    if (releases.length === 0) throw new Error('empty')
    return releases
  } catch (error) {
    return []
  }
}

function renderLatest(releases) {
  const latest = releases[0]
  if (!latest) {
    setText('dlMeta', '暂时没有可下载的版本，请联系管理员')
    $('dlBtn').setAttribute('aria-disabled', 'true')
    setText('heroMeta', '暂无发布版本，联系管理员')
    return
  }

  setText('dlVersion', 'Deekseep v' + latest.version_name)
  setText('dlMeta', `${formatDate(latest.released_at)} 发布 · ${formatSize(latest.size)} · Android 8.0+`)
  setText('dlSize', formatSize(latest.size))
  if (latest.sha256) setText('dlHash', 'SHA-256 ' + latest.sha256)
  // 静态托管（GitHub Pages）时，所有下载入口都指向控制面
  if (API_BASE) {
    document.querySelectorAll('.js-download').forEach((el) => {
      el.href = API_BASE + '/download'
    })
  }
  setText('heroMeta', `最新版 v${latest.version_name} · ${formatSize(latest.size)} · 免费试用`)
}

function renderTable(releases) {
  const tbody = document.querySelector('#versionTable tbody')
  if (!releases.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">还没有发布记录</td></tr>'
    return
  }
  tbody.innerHTML = releases
    .map((item) => {
      const notes = (item.notes || '').trim() || '—'
      return `<tr>
        <td><b>v${item.version_name}</b><div class="muted" style="font-size:12px">code ${item.version_code}</div></td>
        <td>${formatDate(item.released_at)}</td>
        <td>${formatSize(item.size)}</td>
        <td class="notes">${escapeHtml(notes)}</td>
      </tr>`
    })
    .join('')
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
}

function fillContact() {
  // 新版关于页换成了二维码，这些元素可能不存在，全部做空值保护
  setText('cWechat', CONTACT.wechat)
  setText('cHours', CONTACT.hours)
  const email = document.getElementById('cEmail')
  if (email) {
    email.textContent = CONTACT.email
    email.href = 'mailto:' + CONTACT.email
  }
  setText('year', new Date().getFullYear())
}

;(async () => {
  fillContact()
  const releases = await loadReleases()
  renderLatest(releases)
  renderTable(releases)
})()


// 滚动到内容区时给导航加一条细线
const nav = document.querySelector('.nav')
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}
