(() => {
  const trigger = document.querySelector('[data-instagram]')
  const dialog = document.querySelector('.instagram-dialog')
  const article = document.querySelector('[data-fiche-number]')
  if (!trigger || !dialog?.showModal || !article) return

  const width = 1080
  const height = 1350
  const margin = 80
  const serif = '"Cormorant Garamond", Georgia, serif'
  const sans = '"Plus Jakarta Sans", Arial, sans-serif'
  const colors = { ink: '#262019', paper: '#f9edd9', pale: '#fff2da', gold: '#ecc68a', terra: '#552c2a', clay: '#653d20' }
  const descriptions = ['Couverture', 'Les 3 points clés', 'L’anecdote et la référence']
  const status = dialog.querySelector('.instagram-status')
  const preview = dialog.querySelector('.instagram-preview')
  const image = preview.querySelector('img')
  const label = preview.querySelector('[data-slide-label]')
  const download = preview.querySelector('[data-download]')
  const zip = preview.querySelector('[data-zip]')
  const share = preview.querySelector('[data-share]')
  const text = selector => article.querySelector(selector).textContent.trim()
  const number = article.dataset.ficheNumber
  const domain = article.dataset.ficheDomain
  const title = text('h1')
  let images
  let index = 0
  let generating = false

  function font(context, size, family, weight) {
    context.font = `${weight} ${size}px ${family}`
  }

  function write(context, value, x, y, size, family, color, weight = 700) {
    font(context, size, family, weight)
    context.fillStyle = color
    context.fillText(value, x, y)
  }

  function wrap(context, value, maxWidth) {
    const lines = []
    let line = ''
    for (const word of value.split(/\s+/)) {
      const candidate = line ? line + ' ' + word : word
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate
        continue
      }
      if (line) lines.push(line)
      line = ''
      for (const char of word) {
        if (line && context.measureText(line + char).width > maxWidth) {
          lines.push(line)
          line = ''
        }
        line += char
      }
    }
    if (line) lines.push(line)
    return lines
  }

  function paragraph(context, value, box, style) {
    for (let size = style.size; size >= 17; size -= 1) {
      font(context, size, style.family, style.weight)
      const lines = wrap(context, value, box.width)
      const step = size * style.leading
      const blockHeight = lines.length * step
      if (blockHeight > box.height) continue
      context.fillStyle = style.color
      lines.forEach((line, lineIndex) => context.fillText(line, box.x, box.y + lineIndex * step))
      return
    }
    throw new Error('Le texte ne tient pas dans l’image.')
  }

  function rect(context, color, x, y, w, h) {
    context.fillStyle = color
    context.fillRect(x, y, w, h)
  }

  function line(context, color, x, y, length) {
    rect(context, color, x, y, length, 2)
  }

  function circle(context, x, y, radius, stroke, fill) {
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI)
    if (fill) {
      context.fillStyle = fill
      context.fill()
    }
    context.strokeStyle = stroke
    context.lineWidth = 2
    context.stroke()
  }

  function base(context, position, background, primary, secondary) {
    context.textBaseline = 'top'
    rect(context, background, 0, 0, width, height)
    context.strokeStyle = secondary
    context.lineWidth = 1
    context.globalAlpha = .4
    context.strokeRect(35, 35, width - 70, height - 70)
    context.globalAlpha = 1
    write(context, 'QG', margin, 69, 53, serif, primary)
    write(context, 'CARNETS DE CULTURE GÉNÉRALE', 182, 82, 25, sans, secondary)
    line(context, secondary, margin, 143, width - 2 * margin)
    line(context, secondary, margin, 1227, width - 2 * margin)
    write(context, 'VACHETVIRGINIE.GITHUB.IO/QG', margin, 1256, 22, sans, secondary)
    context.textAlign = 'right'
    write(context, `#${number}   /   0${position}`, width - margin, 1253, 27, sans, primary)
    context.textAlign = 'left'
  }

  function cover(context, sketch) {
    base(context, 1, colors.ink, colors.pale, colors.gold)
    write(context, domain.toLocaleUpperCase('fr'), margin, 186, 28, sans, colors.gold)
    paragraph(context, title, { x: margin, y: 239, width: 920, height: 257 },
      { size: 116, family: serif, weight: 700, leading: .95, color: colors.pale })
    circle(context, 540, 655, 158, colors.gold)
    circle(context, 540, 655, 140, colors.gold, colors.terra)
    for (const x of [312, 768]) {
      line(context, colors.gold, x - 30, 655, 60)
      rect(context, colors.gold, x - 1, 625, 2, 60)
    }
    context.drawImage(sketch, 426, 564, 228, 182)
    write(context, 'L’ESSENTIEL EN BREF', margin, 865, 26, sans, colors.gold)
    paragraph(context, text('.lead > p'), { x: margin, y: 921, width: 920, height: 252 },
      { size: 42, family: sans, weight: 500, leading: 1.38, color: colors.pale })
  }

  function points(context) {
    base(context, 2, colors.paper, colors.ink, colors.clay)
    write(context, 'Les 3 points clés', margin, 180, 88, serif, colors.ink)
    for (const [position, item] of [...article.querySelectorAll('.key-points li')].entries()) {
      const y = 306 + position * 296
      const heading = item.querySelector('strong').textContent.trim()
      const value = item.textContent.trim().slice(heading.length).trim()
      circle(context, 112, y + 37, 30, colors.clay)
      write(context, String(position + 1), 103, y + 20, 27, sans, colors.clay)
      write(context, heading.slice(0, -1), 166, y + 5, 51, serif, colors.ink)
      paragraph(context, value, { x: 166, y: y + 73, width: 834, height: 193 },
        { size: 38, family: sans, weight: 500, leading: 1.36, color: colors.ink })
      if (position < 2) line(context, colors.clay, margin, y + 274, 920)
    }
  }

  function memory(context, sketch) {
    base(context, 3, colors.terra, colors.pale, colors.gold)
    write(context, 'L’anecdote à retenir', margin, 184, 79, serif, colors.pale)
    context.drawImage(sketch, 770, 917, 145, 116)
    paragraph(context, text('.anecdote p'), { x: margin, y: 315, width: 920, height: 489 },
      { size: 57, family: serif, weight: 700, leading: 1.12, color: colors.pale })
    line(context, colors.gold, margin, 841, 920)
    write(context, 'POUR ALLER PLUS LOIN', margin, 882, 25, sans, colors.gold)
    paragraph(context, text('.reference a'), { x: margin, y: 941, width: 630, height: 193 },
      { size: 36, family: sans, weight: 600, leading: 1.34, color: colors.pale })
  }

  async function loadSketch() {
    const svg = article.querySelector('.sketch svg').cloneNode(true)
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('stroke', colors.gold)
    const illustration = new Image()
    illustration.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.outerHTML)
    await illustration.decode()
    return illustration
  }

  async function renderSlides() {
    await Promise.allSettled([document.fonts.load(`700 100px ${serif}`), document.fonts.load(`500 40px ${sans}`)])
    const sketch = await loadSketch()
    const files = []
    for (const [offset, draw] of [cover, points, memory].entries()) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      draw(canvas.getContext('2d'), sketch)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Le navigateur ne peut pas exporter cette image.')
      files.push(new File([blob], `qg-${number}-0${offset + 1}.png`, { type: 'image/png' }))
    }
    return files
  }

  function crc32(bytes) {
    let crc = 0xffffffff
    for (const byte of bytes) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    return (crc ^ 0xffffffff) >>> 0
  }

  // ZIP sans compression : les PNG sont déjà compressés.
  async function createZip(files) {
    const local = []
    const directory = []
    let offset = 0
    let directorySize = 0
    for (const file of files) {
      const name = new TextEncoder().encode(file.name)
      const data = new Uint8Array(await file.arrayBuffer())
      const checksum = crc32(data)
      const header = new DataView(new ArrayBuffer(30))
      header.setUint32(0, 0x04034b50, true)
      header.setUint16(4, 20, true)
      header.setUint16(12, 0x21, true)
      header.setUint32(14, checksum, true)
      header.setUint32(18, data.length, true)
      header.setUint32(22, data.length, true)
      header.setUint16(26, name.length, true)

      const entry = new DataView(new ArrayBuffer(46))
      entry.setUint32(0, 0x02014b50, true)
      entry.setUint16(4, 20, true)
      new Uint8Array(entry.buffer, 6, 26).set(new Uint8Array(header.buffer, 4, 26))
      entry.setUint32(42, offset, true)
      local.push(header.buffer, name, data)
      directory.push(entry.buffer, name)
      offset += header.byteLength + name.length + data.length
      directorySize += entry.byteLength + name.length
    }
    const end = new DataView(new ArrayBuffer(22))
    end.setUint32(0, 0x06054b50, true)
    end.setUint16(8, files.length, true)
    end.setUint16(10, files.length, true)
    end.setUint32(12, directorySize, true)
    end.setUint32(16, offset, true)
    return new Blob([...local, ...directory, end.buffer], { type: 'application/zip' })
  }

  function showSlide(nextIndex) {
    index = (nextIndex + images.length) % images.length
    const slide = images[index]
    image.src = slide.url
    image.alt = `${descriptions[index]} · ${title}`
    label.textContent = `${index + 1} / ${images.length} · ${descriptions[index]}`
    download.href = slide.url
    download.download = slide.file.name
  }

  trigger.addEventListener('click', async () => {
    dialog.showModal()
    if (images || generating) return
    generating = true
    status.textContent = 'Préparation des trois images…'
    try {
      const files = await renderSlides()
      zip.href = URL.createObjectURL(await createZip(files))
      zip.download = `qg-${number}-carrousel.zip`
      images = files.map(file => ({ file, url: URL.createObjectURL(file) }))
      share.hidden = !navigator.canShare?.({ files })
      showSlide(0)
      status.textContent = ''
      preview.hidden = false
    } catch {
      status.textContent = 'L’export a échoué. Ferme cette fenêtre et réessaie.'
    } finally {
      generating = false
    }
  })
  dialog.addEventListener('close', () => trigger.focus())
  preview.querySelector('[data-previous]').addEventListener('click', () => showSlide(index - 1))
  preview.querySelector('[data-next]').addEventListener('click', () => showSlide(index + 1))
  share.addEventListener('click', async () => {
    try {
      await navigator.share({ files: images.map(slide => slide.file) })
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Le partage a échoué. Tu peux télécharger les images.'
    }
  })
  trigger.hidden = false
})()
