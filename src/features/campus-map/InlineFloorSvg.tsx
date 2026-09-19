import { useEffect, useMemo, useState } from 'react';

function sanitizeSvg(svgText: string, selectedShapeId?: string): string {
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const root = document.documentElement;
  if (root.nodeName.toLowerCase() !== 'svg') return '';

  root.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((element) => element.remove());
  root.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
      if ((attribute.name === 'href' || attribute.name === 'xlink:href') && /^(?:https?:|data:)/i.test(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  if (selectedShapeId) {
    document.getElementById(selectedShapeId)?.classList.add('ustudy-floor-map-room-selected');
    const roomCode = selectedShapeId.replace(/^room-/, '').toUpperCase();
    root.querySelectorAll('text').forEach((text) => {
      if (text.textContent?.trim().toUpperCase() === roomCode) text.classList.add('ustudy-floor-map-room-label-selected');
    });
  }
  return root.innerHTML;
}

export function InlineFloorSvg({ asset, selectedShapeId }: { asset: string; selectedShapeId?: string }) {
  const [source, setSource] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setSource(undefined);
    setFailed(false);
    fetch(asset, { signal: controller.signal })
      .then((response) => response.ok ? response.text() : Promise.reject(new Error(String(response.status))))
      .then(setSource)
      .catch((error: unknown) => { if ((error as DOMException).name !== 'AbortError') setFailed(true); });
    return () => controller.abort();
  }, [asset]);

  const markup = useMemo(() => source ? sanitizeSvg(source, selectedShapeId) : '', [source, selectedShapeId]);
  if (failed) return <text x="50%" y="50%" textAnchor="middle" fill="#64748b" fontSize="18">Không thể tải sơ đồ tầng.</text>;
  if (!markup) return <text x="50%" y="50%" textAnchor="middle" fill="#64748b" fontSize="18">Đang tải sơ đồ tầng…</text>;
  return <g className="ustudy-floor-map" dangerouslySetInnerHTML={{ __html: markup }} />;
}
