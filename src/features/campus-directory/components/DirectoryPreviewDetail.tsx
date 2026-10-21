import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Clock3, Copy, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import type { CampusUnit, CampusUnitServiceDetail } from '../../../assets/data/campus-directory';
import { directoryMapLink, directoryTypeLabel, locationLabel, phoneHref } from '../directory-preview-utils';

function ContactRow({ value, href, kind, onCopy }: {
  value: string; href?: string; kind: 'phone' | 'email' | 'website'; onCopy: (value: string) => void;
}) {
  const Icon = kind === 'phone' ? Phone : kind === 'email' ? Mail : ExternalLink;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy('Đã sao chép');
    } catch { onCopy('Không thể sao chép. Bạn có thể chọn và sao chép nội dung trực tiếp.'); }
  };
  return <div className="directory-preview-contact">
    <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      {href ? <a href={href} target={kind === 'website' ? '_blank' : undefined} rel={kind === 'website' ? 'noopener noreferrer' : undefined}>{kind === 'website' ? value.replace(/^https?:\/\//, '').replace(/\/$/, '') : value}</a> : <span className="text-sm">{value}</span>}
    </div>
    <button type="button" onClick={() => void copy()} className="directory-preview-icon-button" aria-label={`Sao chép ${value}`} title="Sao chép">
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  </div>;
}

function ServiceContent({ details }: { details: CampusUnitServiceDetail[] }) {
  return <div className="directory-preview-service-body">
    {details.map((detail, index) => {
      if (detail.type === 'paragraph') return <p key={index} className="text-slate-600">{detail.text}</p>;
      if (detail.type === 'list') return <div key={index}>{detail.title && <p className="mb-2 font-medium">{detail.title}</p>}<ul className="list-disc space-y-1 pl-5 text-slate-600">{detail.items.map((item, i) => <li key={i}>{item}</li>)}</ul></div>;
      if (detail.type === 'notice') return <div key={index} className={`border-l-2 px-3 py-2 ${detail.tone === 'warning' ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-blue-400 bg-blue-50 text-blue-900'}`}><p className="font-medium">{detail.title}</p><p className="mt-1">{detail.text}</p></div>;
      return <a key={index} className="flex min-h-11 items-center gap-2 font-medium text-[#004A98] hover:underline" href={detail.href} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 shrink-0" />{detail.label}</a>;
    })}
  </div>;
}

export function DirectoryPreviewDetail({ unit, allUnits, onSelectUnit }: {
  unit: CampusUnit; allUnits: CampusUnit[]; onSelectUnit: (id: string) => void;
}) {
  const [copyStatus, setCopyStatus] = useState('');
  const parent = allUnits.find(item => item.id === unit.parentId);
  const children = allUnits.filter(item => item.parentId === unit.id);
  const hasContacts = Boolean(unit.phones?.length || unit.emails?.length || unit.websites?.length);
  return <article className="directory-preview-detail">
    <header className="directory-preview-detail-header">
      <p className="text-xs font-medium text-[#004A98]">{directoryTypeLabel(unit.type)}{unit.shortName && ` · ${unit.shortName}`}</p>
      <h2 className="mt-1 text-xl font-semibold leading-7 text-slate-900">{unit.name}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{unit.summary}</p>
    </header>
    <div className="directory-preview-detail-body">
      <section className="directory-preview-section" aria-label="Liên hệ">
        <h3>Liên hệ</h3>
        {hasContacts ? <div>
          {unit.phones?.map(value => <ContactRow key={value} value={value} href={phoneHref(value)} kind="phone" onCopy={setCopyStatus} />)}
          {unit.emails?.map(value => <ContactRow key={value} value={value} href={`mailto:${value}`} kind="email" onCopy={setCopyStatus} />)}
          {unit.websites?.map(value => <ContactRow key={value} value={value} href={value} kind="website" onCopy={setCopyStatus} />)}
        </div> : <p className="text-sm text-slate-500">Chưa có thông tin liên hệ trong danh bạ.</p>}
        <p role="status" className="min-h-5 text-xs text-slate-500">{copyStatus}</p>
      </section>
      {(unit.locations.length > 0 || unit.openingHours) && <section className="directory-preview-section">
        <h3>Địa điểm & giờ làm việc</h3>
        <div className="space-y-3">
          {unit.locations.map((location, index) => {
            const mapLink = directoryMapLink(location);
            return <div key={index} className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0 flex-1 text-sm leading-6">
                <p className="break-words text-slate-700">{locationLabel(location)}</p>
                {mapLink ? <Link to={mapLink.href} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-[#004A98] hover:underline"><MapPin className="h-3.5 w-3.5" />{mapLink.label}<ChevronRight className="h-3.5 w-3.5" /></Link> : <p className="text-xs text-slate-500">Chưa liên kết với bản đồ</p>}
              </div>
            </div>;
          })}
          {unit.openingHours && <p className="flex items-start gap-3 text-sm leading-6 text-slate-600"><Clock3 className="mt-1 h-4 w-4 shrink-0 text-slate-400" />{unit.openingHours}</p>}
        </div>
      </section>}
      {Boolean(unit.services?.length) && <section className="directory-preview-section">
        <h3>Thủ tục & hỗ trợ <span className="ml-1 text-xs font-normal text-slate-400">{unit.services!.length}</span></h3>
        {unit.services!.map(service => <details key={service.id} className="directory-preview-service"><summary>{service.name}<ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /></summary><ServiceContent details={service.details} /></details>)}
      </section>}
      {(parent || children.length > 0) && <section className="directory-preview-section">
        <details className="directory-preview-disclosure"><summary>Đơn vị liên quan<ChevronDown className="h-4 w-4 text-slate-400" /></summary>
          {parent && <><p className="mt-1 text-xs text-slate-500">Trực thuộc</p><button type="button" className="directory-preview-related" onClick={() => onSelectUnit(parent.id)}><ChevronRight className="h-4 w-4 shrink-0" />{parent.name}</button></>}
          {children.length > 0 && <><p className="mt-2 text-xs text-slate-500">Đơn vị trực thuộc</p>{children.map(child => <button key={child.id} type="button" className="directory-preview-related" onClick={() => onSelectUnit(child.id)}><ChevronRight className="h-4 w-4 shrink-0" />{child.name}</button>)}</>}
        </details>
      </section>}
      {unit.description && <section className="directory-preview-section"><details className="directory-preview-disclosure"><summary>Giới thiệu thêm<ChevronDown className="h-4 w-4 text-slate-400" /></summary><p className="pb-3 text-sm leading-6 text-slate-600">{unit.description}</p></details></section>}
      <footer className="mt-6 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
        <p>{unit.verificationStatus === 'verified' ? 'Đã đối chiếu nguồn' : 'Thông tin cần kiểm tra với đơn vị'}{unit.lastVerifiedAt ? ` · ${unit.lastVerifiedAt.split('-').reverse().join('/')}` : ''}</p>
        {unit.sourceUrl && <a className="inline-flex min-h-9 items-center gap-1 text-[#004A98] hover:underline" href={unit.sourceUrl} target="_blank" rel="noopener noreferrer">Nguồn thông tin<ExternalLink className="h-3 w-3" /></a>}
      </footer>
    </div>
  </article>;
}
