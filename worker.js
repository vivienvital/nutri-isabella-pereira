// Serve os arquivos estáticos e responde a pedidos parciais (Range) dos vídeos,
// necessários pro Safari/iPhone tocar MP4.
export default {
  async fetch(request, env) {
    const range = request.headers.get('Range');
    const res = await env.ASSETS.fetch(request);
    if (!range || res.status !== 200) return res;
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (!m) return res;
    const buf = await res.arrayBuffer();
    const size = buf.byteLength;
    let start = m[1] === '' ? size - parseInt(m[2], 10) : parseInt(m[1], 10);
    let end = m[1] !== '' && m[2] !== '' ? parseInt(m[2], 10) : size - 1;
    if (isNaN(start) || start < 0) start = 0;
    if (end >= size) end = size - 1;
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    const headers = new Headers(res.headers);
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    headers.set('Accept-Ranges', 'bytes');
    return new Response(buf.slice(start, end + 1), { status: 206, headers });
  }
};
