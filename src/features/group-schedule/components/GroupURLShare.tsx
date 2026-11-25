import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '../../../components/ui/form/button';
import { Input } from '../../../components/ui/form/input';

interface GroupURLShareProps {
  url: string;
  warning?: string | null;
}

export function GroupURLShare({ url, warning }: GroupURLShareProps) {
  const [copied, setCopied] = useState(false);

  const [manual, setManual] = useState(false);
  const handleCopy = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); }
    catch { setManual(true); return; }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  if (!url) return null;

  return (
    <div>
      <Button type="button" onClick={handleCopy} className="ustudy-button-primary min-h-11">
        {copied ? <Check /> : <Copy />}{copied ? 'Đã sao chép' : 'Sao chép liên kết'}
      </Button>
      {manual && <Input aria-label="Liên kết nhóm" readOnly value={url} onFocus={event => event.target.select()} />}
      {warning && <p className="mt-1 text-xs text-amber-700">{warning}</p>}
    </div>
  );
}
