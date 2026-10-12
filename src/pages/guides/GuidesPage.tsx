import { useEffect, type ReactNode } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CalendarDays,
    Calculator,
    CircleAlert,
    GraduationCap,
    Info,
} from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { PageHeader, PageShell } from '../../components/layout';
import { APP_ROUTES } from '../../app/routes';

interface GuideSummary {
    path: string;
    title: string;
    description: string;
    readingTime: string;
    icon: typeof Calculator;
}

const GUIDES: GuideSummary[] = [
    {
        path: APP_ROUTES.guideGpa,
        title: 'Cách UStudy tính GPA',
        description: 'GPA học kỳ, GPA tích lũy, môn rớt, học lại, cải thiện và các học phần không tính điểm.',
        readingTime: '6 phút đọc',
        icon: Calculator,
    },
    {
        path: APP_ROUTES.guideStudyRoadmap,
        title: 'Hiểu lộ trình học tập',
        description: 'Cách phân loại môn, cộng tín chỉ, giới hạn nhóm tự chọn và đề xuất môn nên học.',
        readingTime: '6 phút đọc',
        icon: GraduationCap,
    },
    {
        path: APP_ROUTES.guideSchedule,
        title: 'Hiểu thời khóa biểu',
        description: 'Cách đọc chuỗi lịch Portal, tính số tuần học, ngày bắt đầu và xử lý LT, TH, BT.',
        readingTime: '7 phút đọc',
        icon: CalendarDays,
    },
];

const PAGE_META: Record<string, { title: string; description: string }> = {
    [APP_ROUTES.guide]: {
        title: 'Hướng dẫn UStudy',
        description: 'Giải thích cách UStudy tính GPA, lộ trình học tập và thời khóa biểu từ dữ liệu Portal.',
    },
    ...Object.fromEntries(GUIDES.map((guide) => [guide.path, {
        title: `${guide.title} | UStudy`,
        description: guide.description,
    }])),
};

function usePageMeta(pathname: string) {
    useEffect(() => {
        const meta = PAGE_META[pathname] ?? PAGE_META[APP_ROUTES.guide];
        document.title = meta.title;

        let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (!description) {
            description = document.createElement('meta');
            description.name = 'description';
            document.head.appendChild(description);
        }
        description.content = meta.description;
    }, [pathname]);
}

function GuideIndex() {
    return (
        <PageShell
            header={(
                <PageHeader
                    title="Hướng dẫn UStudy"
                    description="Hiểu rõ dữ liệu và các phép tính phía sau những con số UStudy hiển thị."
                />
            )}
            contentClassName="mx-auto w-full max-w-5xl"
        >
            <section className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-5 sm:px-6" aria-labelledby="guide-introduction">
                <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#0056A6]" aria-hidden="true" />
                    <div>
                        <h2 id="guide-introduction" className="text-base font-semibold text-gray-900">UStudy biến dữ liệu Portal thành thông tin như thế nào?</h2>
                        <p className="mt-1.5 text-sm leading-6 text-gray-700">
                            Các bài viết dưới đây mô tả đúng logic đang được ứng dụng sử dụng. Bạn có thể dùng chúng để kiểm tra kết quả,
                            hiểu trường hợp đặc biệt và biết khi nào cần đối chiếu lại với Portal hoặc quy định chính thức của trường.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-6" aria-labelledby="guide-list-title">
                <h2 id="guide-list-title" className="text-lg font-semibold text-gray-900">Chọn nội dung cần tìm hiểu</h2>
                <div className="mt-3 divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {GUIDES.map((guide) => {
                        const Icon = guide.icon;
                        return (
                            <Link
                                key={guide.path}
                                to={guide.path}
                                className="group flex items-start gap-4 px-4 py-5 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:px-5"
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0056A6]">
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold text-gray-900 group-hover:text-[#0056A6]">{guide.title}</span>
                                    <span className="mt-1 block text-sm leading-6 text-gray-600">{guide.description}</span>
                                    <span className="mt-2 block text-xs font-medium text-gray-500">{guide.readingTime}</span>
                                </span>
                                <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-gray-400 group-hover:text-[#0056A6]" aria-hidden="true" />
                            </Link>
                        );
                    })}
                </div>
            </section>

            <aside className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>UStudy là công cụ hỗ trợ cá nhân, không thay thế bảng điểm, chương trình đào tạo hoặc thông báo chính thức của nhà trường.</p>
            </aside>
        </PageShell>
    );
}

function GuideArticle({
    title,
    description,
    readingTime,
    sections,
    children,
}: {
    title: string;
    description: string;
    readingTime: string;
    sections: Array<{ id: string; label: string }>;
    children: ReactNode;
}) {
    return (
        <PageShell contentClassName="mx-auto w-full max-w-6xl">
            <Link to={APP_ROUTES.guide} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#0056A6] hover:underline">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Tất cả hướng dẫn
            </Link>

            <article className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                <div className="min-w-0">
                    <header className="border-b border-gray-200 pb-6">
                        <p className="text-sm font-semibold text-[#0056A6]">Hướng dẫn UStudy · {readingTime}</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
                        <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600">{description}</p>
                    </header>
                    <div className="guide-article-content">{children}</div>
                </div>

                <nav className="rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-5" aria-label="Mục lục bài viết">
                    <p className="text-sm font-semibold text-gray-900">Trong bài này</p>
                    <ol className="mt-2 space-y-1">
                        {sections.map((section, index) => (
                            <li key={section.id}>
                                <a className="block rounded-md px-2 py-1.5 text-sm leading-5 text-gray-600 hover:bg-blue-50 hover:text-[#0056A6]" href={`#${section.id}`}>
                                    {index + 1}. {section.label}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>
            </article>
        </PageShell>
    );
}

function ArticleSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section id={id} className="scroll-mt-6 border-b border-gray-200 py-7 last:border-b-0">
            <h2 className="text-xl font-semibold text-gray-950">{title}</h2>
            <div className="mt-3 space-y-4 text-[15px] leading-7 text-gray-700">{children}</div>
        </section>
    );
}

function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
    const warning = tone === 'warning';
    return (
        <aside className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${warning ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-blue-100 bg-blue-50 text-blue-950'}`}>
            {warning ? <CircleAlert className="mt-1 h-4 w-4 shrink-0" /> : <Info className="mt-1 h-4 w-4 shrink-0" />}
            <div>{children}</div>
        </aside>
    );
}

function Formula({ children }: { children: ReactNode }) {
    return <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm font-semibold text-gray-900">{children}</div>;
}

const GPA_SECTIONS = [
    { id: 'du-lieu', label: 'Dữ liệu đầu vào' },
    { id: 'gpa-hoc-ky', label: 'GPA học kỳ' },
    { id: 'gpa-tich-luy', label: 'GPA tích lũy' },
    { id: 'hoc-lai-cai-thien', label: 'Học lại và cải thiện' },
    { id: 'ngoai-le', label: 'Ngoại lệ và hệ 4' },
];

function GpaGuide() {
    return (
        <GuideArticle
            title="Cách UStudy tính GPA"
            description="Giải thích sự khác nhau giữa GPA học kỳ và GPA tích lũy, cùng cách ứng dụng xử lý môn rớt, học lại, cải thiện và môn chưa có điểm."
            readingTime="6 phút đọc"
            sections={GPA_SECTIONS}
        >
            <ArticleSection id="du-lieu" title="Dữ liệu nào được đưa vào phép tính?">
                <p>UStudy đọc điểm hệ 10, số tín chỉ, học kỳ và mã môn từ dữ liệu bạn nhập từ Portal. Dòng chưa có điểm, điểm trống hoặc ký hiệu đang chờ kết quả không được đưa vào phép tính GPA.</p>
                <p>Ngưỡng đạt đang dùng là <strong>5,0 điểm hệ 10</strong>. Điểm thấp hơn ngưỡng này được xem là chưa đạt, nhưng cách xử lý sẽ khác nhau giữa GPA học kỳ và GPA tích lũy.</p>
            </ArticleSection>

            <ArticleSection id="gpa-hoc-ky" title="GPA học kỳ vẫn tính môn dưới 5">
                <p>GPA học kỳ phản ánh toàn bộ kết quả có điểm trong chính học kỳ đó. Vì vậy, môn dưới 5 vẫn tham gia vào mẫu số và kéo GPA học kỳ xuống.</p>
                <Formula>GPA học kỳ = Σ(điểm hệ 10 × tín chỉ) / Σ(tín chỉ có điểm)</Formula>
                <p><strong>Ví dụ:</strong> một môn 4 tín chỉ đạt 8,0 và một môn 4 tín chỉ đạt 4,0 thì GPA học kỳ là <strong>6,0</strong>. Tín chỉ đạt của học kỳ chỉ là 4, nhưng cả 8 tín chỉ vẫn tham gia phép tính GPA học kỳ.</p>
                <p>Các dòng có loại <code>CT</code> và các môn thuộc nhóm không tính GPA được loại khỏi phép tính này.</p>
            </ArticleSection>

            <ArticleSection id="gpa-tich-luy" title="GPA tích lũy chỉ dùng kết quả hiệu lực đã đạt">
                <p>Với GPA toàn khóa, UStudy gom các lần xuất hiện theo mã môn, chọn lần học mới nhất làm kết quả hiệu lực, rồi chỉ cộng môn có điểm từ 5,0 trở lên.</p>
                <Formula>GPA tích lũy = Σ(điểm đạt hiệu lực × tín chỉ) / Σ(tín chỉ đạt hiệu lực)</Formula>
                <p>Môn chưa đạt không được cộng vào GPA tích lũy và cũng không tạo tín chỉ tích lũy. Môn chưa có điểm được bỏ qua hoàn toàn cho đến khi có kết quả.</p>
                <Note tone="warning">Nếu Portal hoặc quy định của chương trình áp dụng cách chọn kết quả khác cho một trường hợp đặc biệt, hãy lấy bảng điểm chính thức làm chuẩn.</Note>
            </ArticleSection>

            <ArticleSection id="hoc-lai-cai-thien" title="Môn học lại và môn cải thiện được xử lý ra sao?">
                <p>Khi cùng một mã môn xuất hiện nhiều lần, UStudy xem lần thuộc học kỳ mới hơn là kết quả hiện hành. Điều này áp dụng cho cả học lại sau khi rớt và học cải thiện sau khi đã đạt.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li><strong>GPA từng học kỳ:</strong> mỗi lần học vẫn nằm trong học kỳ tương ứng của nó.</li>
                    <li><strong>GPA tích lũy:</strong> chỉ lần mới nhất của mã môn được dùng; tín chỉ không bị cộng hai lần.</li>
                    <li><strong>Mô phỏng điểm:</strong> điểm dự kiến thay thế kết quả hiệu lực để ước tính GPA mới, nhưng không sửa dữ liệu gốc.</li>
                </ul>
            </ArticleSection>

            <ArticleSection id="ngoai-le" title="Môn không tính GPA và quy đổi hệ 4">
                <p>Các nhóm Giáo dục thể chất, Ngoại ngữ, Giáo dục quốc phòng – an ninh và môn Tin học cơ sở có thể xuất hiện trong lịch sử học tập nhưng được loại khỏi GPA và tổng tín chỉ tích lũy chính theo rule hiện tại.</p>
                <p>Điểm hệ 4 của UStudy được nội suy từ hệ 10: dưới 3 là 0; từ 9 trở lên là 4; khoảng giữa tăng 0,5 điểm hệ 4 cho mỗi 1 điểm hệ 10. Kết quả này phục vụ hiển thị và mô phỏng trong UStudy.</p>
                <Note>Con số trên UStudy là kết quả tính từ dữ liệu đã nhập. Khi có chênh lệch, hãy kiểm tra mã môn trùng, lần học mới nhất, số tín chỉ và trạng thái điểm trên Portal trước.</Note>
            </ArticleSection>
        </GuideArticle>
    );
}

const ROADMAP_SECTIONS = [
    { id: 'phan-loai', label: 'Phân loại trạng thái môn' },
    { id: 'tin-chi', label: 'Cách cộng tín chỉ' },
    { id: 'gioi-han', label: 'Giới hạn nhóm đại cương' },
    { id: 'de-xuat', label: 'Đề xuất môn nên học' },
    { id: 'bat-buoc', label: 'Ý nghĩa mandatory' },
];

function StudyRoadmapGuide() {
    return (
        <GuideArticle
            title="Hiểu lộ trình học tập"
            description="Cách UStudy ghép kết quả học tập với chương trình đào tạo, tính tiến độ từng nhóm và tạo danh sách môn gợi ý."
            readingTime="6 phút đọc"
            sections={ROADMAP_SECTIONS}
        >
            <ArticleSection id="phan-loai" title="Một môn được xếp trạng thái như thế nào?">
                <p>UStudy đối chiếu mã môn trong chương trình đào tạo với bảng điểm, danh sách đăng ký và kế hoạch thủ công của bạn.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li><strong>Đã hoàn thành:</strong> có kết quả hiệu lực đạt từ 5,0 trở lên.</li>
                    <li><strong>Chưa đạt:</strong> có kết quả nhưng dưới ngưỡng đạt.</li>
                    <li><strong>Đang học:</strong> có trong dữ liệu đăng ký nhưng chưa có điểm hoàn chỉnh.</li>
                    <li><strong>Đã lên kế hoạch:</strong> được bạn thêm vào một học kỳ tương lai.</li>
                </ul>
            </ArticleSection>

            <ArticleSection id="tin-chi" title="Tín chỉ đã học và dự kiến được cộng ra sao?">
                <p>Môn đã đạt đóng góp vào tín chỉ hoàn thành. Môn đang học hoặc đã xếp vào kế hoạch đóng góp vào phần dự kiến. Một mã môn chỉ được cộng một lần ngay cả khi nó xuất hiện ở nhiều nhóm của chương trình.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        ['Đã đạt', 'Cộng vào hoàn thành'],
                        ['Đang học / đã lên kế hoạch', 'Cộng vào dự kiến'],
                        ['Rớt / chưa chọn', 'Chưa cộng tín chỉ'],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
                            <p className="text-sm font-semibold text-gray-900">{label}</p>
                            <p className="mt-1 text-sm text-gray-600">{value}</p>
                        </div>
                    ))}
                </div>
                <p>Các môn được đánh dấu không tính vào tổng chính vẫn có thể hiện trong nhóm riêng để bạn theo dõi, nhưng không làm tăng tiến độ của nhóm cha.</p>
            </ArticleSection>

            <ArticleSection id="gioi-han" title="Vì sao học dư đại cương không làm tổng tín chỉ vượt yêu cầu?">
                <p>Mỗi nhóm con trong Giáo dục đại cương có một số tín chỉ yêu cầu cố định. UStudy lấy giá trị nhỏ hơn giữa số tín chỉ bạn đã học và mức yêu cầu của nhóm.</p>
                <Formula>Tín chỉ được ghi nhận cho nhóm = min(tín chỉ đạt, tín chỉ yêu cầu)</Formula>
                <p>Ví dụ nhóm yêu cầu 6 tín chỉ nhưng bạn đã đạt 9 tín chỉ tự chọn, tiến độ nhóm vẫn là <strong>6/6</strong>. Ba tín chỉ dư không làm tổng chương trình bị phồng lên. Giới hạn này hiện áp dụng cho các nhóm thuộc Giáo dục đại cương.</p>
            </ArticleSection>

            <ArticleSection id="de-xuat" title="Danh sách môn nên học được tạo như thế nào?">
                <p>Hệ thống ưu tiên lần lượt môn cần học lại, môn bắt buộc còn thiếu và môn tự chọn được đề xuất. Nếu môn mục tiêu có điều kiện tiên quyết chưa hoàn thành, UStudy lần ngược chuỗi điều kiện và gợi ý môn đang chặn trước.</p>
                <ol className="list-decimal space-y-2 pl-5">
                    <li>Môn đã rớt và chưa có kết quả thay thế.</li>
                    <li>Môn bắt buộc chưa đạt hoặc chưa học.</li>
                    <li>Môn tự chọn phù hợp để hoàn thành nhóm tín chỉ.</li>
                    <li>Môn tiên quyết cần hoàn thành trước các môn phía sau.</li>
                </ol>
                <Note>Lộ trình là công cụ hỗ trợ lập kế hoạch. Khả năng mở lớp, điều kiện đăng ký và thay đổi chương trình vẫn cần được kiểm tra trên Portal và thông báo của khoa.</Note>
            </ArticleSection>

            <ArticleSection id="bat-buoc" title="mandatory: true và mandatory: false có nghĩa gì?">
                <p><code>mandatory: true</code> cho biết môn hoặc nhóm đó là thành phần bắt buộc của chương trình. <code>mandatory: false</code> cho biết đây là lựa chọn trong một nhóm tự chọn.</p>
                <p>Thuộc tính này mô tả cấu trúc chương trình, không cho biết bạn đã học xong hay chưa. Trạng thái hoàn thành luôn được tính riêng từ dữ liệu điểm và đăng ký.</p>
            </ArticleSection>
        </GuideArticle>
    );
}

const SCHEDULE_SECTIONS = [
    { id: 'chuoi-lich', label: 'Đọc chuỗi lịch Portal' },
    { id: 'so-tuan', label: 'Cách tính số tuần' },
    { id: 'lt-th-bt', label: 'Quy tắc LT, TH, BT' },
    { id: 'ngay-hoc', label: 'Ngày bắt đầu và kết thúc' },
    { id: 'truong-hop-dac-biet', label: 'Trường hợp đặc biệt' },
];

function ScheduleGuide() {
    return (
        <GuideArticle
            title="Hiểu thời khóa biểu UStudy"
            description="Từ chuỗi lịch trên Portal đến ngày, tiết, phòng học và số tuần hiển thị trong thời khóa biểu."
            readingTime="7 phút đọc"
            sections={SCHEDULE_SECTIONS}
        >
            <ArticleSection id="chuoi-lich" title="UStudy đọc chuỗi lịch Portal ra sao?">
                <p>Mỗi đoạn lịch thường gồm thứ, khoảng tiết và phòng, ví dụ <code>T2(1-5)-P.D207</code>. UStudy nhận các ngày từ T2 đến T7 và <code>TCN</code> cho Chủ nhật, đồng thời hỗ trợ tiết có phần thập phân.</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700"><tr><th className="px-4 py-2.5 font-semibold">Chuỗi</th><th className="px-4 py-2.5 font-semibold">Kết quả</th></tr></thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            <tr><td className="px-4 py-3 font-mono">T2(1-5)</td><td className="px-4 py-3">Thứ Hai, 5 tiết</td></tr>
                            <tr><td className="px-4 py-3 font-mono">T7(6.5-10)</td><td className="px-4 py-3">Thứ Bảy, 4,5 tiết</td></tr>
                            <tr><td className="px-4 py-3 font-mono">TCN(1-3)</td><td className="px-4 py-3">Chủ nhật, 3 tiết</td></tr>
                        </tbody>
                    </table>
                </div>
            </ArticleSection>

            <ArticleSection id="so-tuan" title="Số tuần học không được lấy trực tiếp từ số tín chỉ">
                <p>UStudy lấy tổng khối lượng tiết cần học của thành phần môn, chia cho tổng số tiết học mỗi tuần rồi làm tròn lên.</p>
                <Formula>Số tuần = ceil(tổng tiết cần học / tổng tiết mỗi tuần)</Formula>
                <p><strong>Ví dụ:</strong> nếu một lớp có 45 tiết cần học và lịch mỗi tuần gồm hai buổi, mỗi buổi 4 tiết, kết quả là <strong>ceil(45 / 8) = 6 tuần</strong>. Vì vậy, một môn 3 tín chỉ không nhất thiết luôn hiển thị 15 tuần.</p>
                <p>Khoảng tiết được tính bao gồm cả hai đầu: <code>6-9</code> là 4 tiết. Các dòng cùng mã môn và cùng loại LT, TH hoặc BT được cộng lại để tìm số tiết mỗi tuần.</p>
            </ArticleSection>

            <ArticleSection id="lt-th-bt" title="Chọn tổng tiết cho LT, TH và BT">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700"><tr><th className="px-4 py-2.5 font-semibold">Loại lớp</th><th className="px-4 py-2.5 font-semibold">Nguồn giờ mặc định</th></tr></thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            <tr><td className="px-4 py-3 font-semibold">LT</td><td className="px-4 py-3">Giờ lý thuyết</td></tr>
                            <tr><td className="px-4 py-3 font-semibold">TH</td><td className="px-4 py-3">Giờ thực hành</td></tr>
                            <tr><td className="px-4 py-3 font-semibold">BT</td><td className="px-4 py-3">Giờ bài tập</td></tr>
                        </tbody>
                    </table>
                </div>
                <p>Một số mã môn có rule học thuật riêng để lớp ghi LT dùng tổng <strong>LT + TH</strong> hoặc <strong>LT + BT</strong>. Nếu môn đã có dòng TH/BT riêng, hệ thống tránh cộng lặp phần giờ đó.</p>
                <p>Khi lớp ghi LT nhưng giờ lý thuyết bằng 0 và chỉ có giờ thực hành hoặc bài tập, UStudy có thể tự dùng nguồn giờ còn lại nếu không tồn tại lớp TH/BT riêng. Trường hợp mơ hồ sẽ được cảnh báo để kiểm tra hoặc đặt rule thủ công.</p>
            </ArticleSection>

            <ArticleSection id="ngay-hoc" title="Ngày bắt đầu, ngày kết thúc và tuần nghỉ">
                <p>Ngày bắt đầu được xác định từ tuần bắt đầu trong dữ liệu Portal. Với một số dòng TH hoặc BT kế thừa mốc của LT, lịch có thể được dời thêm 14 ngày theo quy tắc hiện tại.</p>
                <Formula>Ngày kết thúc = ngày bắt đầu + (số tuần − 1) × 7 ngày + 6 ngày</Formula>
                <p>Các tuần nghỉ trong lịch học vụ có thể làm nội dung tuần học thực tế dịch chuyển và không tạo buổi học trong tuần nghỉ.</p>
            </ArticleSection>

            <ArticleSection id="truong-hop-dac-biet" title="Phòng chung, Chủ nhật và dữ liệu thiếu">
                <ul className="list-disc space-y-2 pl-5">
                    <li>Nếu một chuỗi chứa nhiều lịch nhưng chỉ đoạn cuối có phòng, phòng cuối được dùng chung khi các đoạn trước hoàn toàn không có phòng.</li>
                    <li>Lịch Chủ nhật chỉ xuất hiện khi dữ liệu có <code>TCN</code>; giao diện không tự tạo cột Chủ nhật cho kỳ không có lịch.</li>
                    <li>Nếu thiếu khối lượng giờ hoặc không đọc được số tiết mỗi tuần, UStudy không đoán số tuần và sẽ trả về cảnh báo.</li>
                </ul>
                <Note tone="warning">Lịch Portal có thể thay đổi sau khi bạn nhập dữ liệu. Hãy đồng bộ lại và đối chiếu Portal trước khi đi học hoặc đăng ký môn.</Note>
            </ArticleSection>
        </GuideArticle>
    );
}

export function GuidesPage() {
    const { pathname } = useLocation();
    const normalizedPath = pathname.replace(/\/$/, '') || '/';
    usePageMeta(normalizedPath);

    if (normalizedPath === APP_ROUTES.guide) return <GuideIndex />;
    if (normalizedPath === APP_ROUTES.guideGpa) return <GpaGuide />;
    if (normalizedPath === APP_ROUTES.guideStudyRoadmap) return <StudyRoadmapGuide />;
    if (normalizedPath === APP_ROUTES.guideSchedule) return <ScheduleGuide />;

    return <Navigate to={APP_ROUTES.guide} replace />;
}
