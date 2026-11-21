import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

doc = docx.Document()

# Standard margins
for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_header(title, level=1):
    h = doc.add_heading(level=level)
    run = h.add_run(title)
    run.font.name = 'Segoe UI'
    run.bold = True
    if level == 1:
        run.font.size = Pt(17)
        run.font.color.rgb = RGBColor(30, 64, 175) # Dark Blue
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(31, 41, 55) # Slate
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
    return h

# Document Title
title_p = doc.add_paragraph()
title_p.paragraph_format.space_before = Pt(0)
title_p.paragraph_format.space_after = Pt(4)
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
t_run = title_p.add_run('Ludo & Snakes-Ladders Reward Game')
t_run.font.name = 'Segoe UI'
t_run.font.size = Pt(22)
t_run.bold = True
t_run.font.color.rgb = RGBColor(30, 58, 138)

sub_p = doc.add_paragraph()
sub_p.paragraph_format.space_after = Pt(14)
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
s_run = sub_p.add_run('সম্পূর্ণ গেম আর্কিটেকচার, ২০ লেভেল রুলস, এআই স্কেলিং ও Moneytag মনেটাইজেশন প্ল্যান')
s_run.font.name = 'Segoe UI'
s_run.font.size = Pt(12)
s_run.font.italic = True
s_run.font.color.rgb = RGBColor(75, 85, 99)

# Metadata banner box
meta_table = doc.add_table(rows=1, cols=1)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_cell = meta_table.cell(0, 0)
set_cell_background(meta_cell, 'F1F5F9')
set_cell_margins(meta_cell, top=140, bottom=140, left=180, right=180)
meta_p = meta_cell.paragraphs[0]
meta_p.paragraph_format.space_after = Pt(0)
m_run = meta_p.add_run('প্রজেক্ট: Lodu Take | ২০ লেভেল | ১০ ম্যাচে ৮ জয় | ৩ হারে Level 1-এ রিসেট | ২০ টাকা/লেভেল | মিনিমাম উইথড্র ২০০ টাকা')
m_run.font.size = Pt(9.5)
m_run.font.bold = True
m_run.font.color.rgb = RGBColor(30, 41, 59)

doc.add_paragraph().paragraph_format.space_after = Pt(4)

# Section 1: Executive Summary
add_header('১. প্রোজেক্ট পরিচিতি ও লক্ষ্য (Project Overview)', level=1)
p = doc.add_paragraph()
p.add_run('এই প্রোজেক্টের লক্ষ্য হলো একটি ইন্টারেক্টিভ ও রোমাঞ্চকর 2-in-1 লুডু ও সাপ-লুডু গেম তৈরি করা। গেমটিতে প্লেয়াররা ২০টি কঠিন লেভেলের মধ্য দিয়ে প্রতিদ্বন্দ্বিতা করবে। প্রতিটি লেভেল ১০টি ম্যাচের সমষ্টি, যেখানে পরবর্তী লেভেলে যেতে হলে কমপক্ষে ৮টি ম্যাচ জিততে হবে। ৩টি ম্যাচ হারলে প্লেয়ারকে একদম শুরুতে (Level 1) ফিরে যেতে হবে (হার্ডকোর রোগলাইক মেকানিক্স)। প্রতি লেভেলে সফল হলে প্লেয়ার ২০ টাকা রিওয়ার্ড পাবে এবং মোট ২০০ টাকা হলে বিকাশ/নগদে উইথড্র করতে পারবে। Moneytag এর অ্যাড নেটওয়ার্কের মাধ্যমে টেকসই রেভিনিউ মডেল সংযুক্ত থাকবে।')

# Section 2: Core Game Mechanics & Rules
add_header('২. কোর গেম রুলস ও লেভেল প্রগ্রেসন (Core Game Rules)', level=1)

table1 = doc.add_table(rows=6, cols=2)
table1.alignment = WD_TABLE_ALIGNMENT.CENTER
table1.autofit = False

headers = ['ফিচার / নিয়ম', 'বিস্তারিত বিবরণ (Specifications)']
data = [
    ['গেম মোড (Game Modes)', '১. ক্লাসিক লুডু (Player vs Smart AI Bot)\n২. সাপ-লুডু (১০০ ঘরের ক্লাসিক বোর্ড, মই ও সাপের বাধা, Player vs Bot)'],
    ['মোট লেভেল ও ম্যাচ', 'মোট ২০টি লেভেল। প্রতিটি লেভেলে ১০টি ম্যাচ (সর্বমোট ২০০ ম্যাচ)।'],
    ['পাস কন্ডিশন (Passing Rule)', 'প্রতিটি লেভেলের ১০টি ম্যাচের মধ্যে অন্তত ৮টি ম্যাচ জিততে হবে (8/10 Wins)।'],
    ['ফেল কন্ডিশন (Reset Rule)', 'যেকোনো লেভেলে ৩টি ম্যাচ হারলে সরাসরি Level 1 (শুরু) থেকে নতুন করে শুরু হবে।'],
    ['রিওয়ার্ড ও উইথড্রয়াল', 'প্রতিটি লেভেল শেষ করলে ২০ টাকা ওয়ালেটে জমা হবে। মোট ২০০ টাকা জমলে উইথড্র করা যাবে।']
]

for row in table1.rows:
    row.cells[0].width = Inches(2.2)
    row.cells[1].width = Inches(4.6)

for i, h_text in enumerate(headers):
    cell = table1.cell(0, i)
    set_cell_background(cell, '1E40AF')
    set_cell_margins(cell, 120, 120, 140, 140)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h_text)
    run.font.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)
    run.font.size = Pt(10)

for r_idx, row_data in enumerate(data):
    for c_idx, cell_data in enumerate(row_data):
        cell = table1.cell(r_idx + 1, c_idx)
        bg = 'F8FAFC' if r_idx % 2 == 0 else 'FFFFFF'
        set_cell_background(cell, bg)
        set_cell_margins(cell, 100, 100, 140, 140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(cell_data)
        run.font.size = Pt(9.5)
        if c_idx == 0:
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(4)

# Section 3: AI & Difficulty System
add_header('৩. ডায়নামিক এআই ও ডিফিকাল্টি স্কেলিং ইঞ্জিন (AI & Difficulty Engine)', level=1)
p2 = doc.add_paragraph()
p2.add_run('গেমটিতে ফেয়ার প্লে থেকে শুরু করে প্রায় অসম্ভব (Rigged) পর্যায়ে ডিফিকাল্টি স্কেল করবে:')

diff_table = doc.add_table(rows=6, cols=3)
diff_table.alignment = WD_TABLE_ALIGNMENT.CENTER
diff_headers = ['লেভেল', 'ডিফিকাল্টি মোড', 'বটের চাল ও ডাইস অ্যালগরিদম']
diff_data = [
    ['Level 1 - 2', 'Easy (সহজ)', 'বট সাধারণ চাল দেবে (সুযোগ থাকলেও গুটি কাটবে না)। ফেয়ার ডাইস রোল।'],
    ['Level 3 - 4', 'Medium (মাঝারি)', 'বট যৌক্তিক চাল দেবে (কাটার সুযোগ থাকলে কাটবে)। ১০০% ফেয়ার ডাইস।'],
    ['Level 5 - 6', 'Hard (কঠিন)', 'বট বুদ্ধিমান চাল দেবে। ২০% ডাইস রোল বটের সুবিধা অনুযায়ী অপ্টিমাইজড হবে।'],
    ['Level 7 - 8', 'Extreme Hard', 'বট নিখুঁত চাল দেবে এবং প্লেয়ারকে আক্রমণ করবে। ৩৫% ডাইস রোল বটের অনুকূলে থাকবে।'],
    ['Level 9 - 20', 'Never Won (অসম্ভব)', 'বটের ডাইস রোল হাইলি ম্যানিপুলেটেড। প্লেয়ার সাপের মুখে পড়বে বা লুডুতে বারবার গুটি কাটা পড়বে।']
]

for row in diff_table.rows:
    row.cells[0].width = Inches(1.3)
    row.cells[1].width = Inches(1.8)
    row.cells[2].width = Inches(3.7)

for i, h_text in enumerate(diff_headers):
    cell = diff_table.cell(0, i)
    set_cell_background(cell, '334155')
    set_cell_margins(cell, 120, 120, 140, 140)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h_text)
    run.font.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)
    run.font.size = Pt(10)

for r_idx, row_data in enumerate(diff_data):
    for c_idx, cell_data in enumerate(row_data):
        cell = diff_table.cell(r_idx + 1, c_idx)
        bg = 'F8FAFC' if r_idx % 2 == 0 else 'FFFFFF'
        set_cell_background(cell, bg)
        set_cell_margins(cell, 100, 100, 140, 140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(cell_data)
        run.font.size = Pt(9.5)
        if c_idx < 2:
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(4)

# Section 4: Reward & Wallet System
add_header('৪. রিওয়ার্ড ও উইথড্রয়াল সিস্টেম (Wallet & Withdrawal)', level=1)
p3 = doc.add_paragraph()
p3.add_run('• লেভেল বোনাস: ').bold = True
p3.add_run('প্রতিটি লেভেল শেষ করলেই সাথে সাথে ২০ টাকা ওয়ালেটে যুক্ত হবে (সর্বোচ্চ ৪০০ টাকা)।\n')
p3.add_run('• উইথড্রয়াল লিমিট: ').bold = True
p3.add_run('মিনিমাম ২০০ টাকা হলে উইথড্র বাটন সক্রিয় হবে (কমপক্ষে ১০টি লেভেল সফল হতে হবে)।\n')
p3.add_run('• পেমেন্ট মেথড: ').bold = True
p3.add_run('বিকাশ (bKash), নগদ (Nagad), ও রকেট (Rocket) অ্যাকাউন্ট নম্বর ইনপুট ফর্ম।\n')
p3.add_run('• সিকিউরিটি: ').bold = True
p3.add_run('এনক্রিপ্টেড স্টেট যাতে ইন্সপেক্ট এলিমেন্ট দিয়ে ফ্রড করা না যায়।')

# Section 5: Moneytag Monetization Architecture
add_header('৫. Moneytag অ্যাডভার্টাইজিং ইন্টিগ্রেশন (Monetization)', level=1)

ad_table = doc.add_table(rows=4, cols=3)
ad_table.alignment = WD_TABLE_ALIGNMENT.CENTER
ad_headers = ['অ্যাড ফরম্যাট', 'প্লেসমেন্ট ও ট্রিগার পয়েন্ট', 'রেভিনিউ সুবিধা']
ad_data = [
    ['In-Page Push (Banner)', 'গেম বোর্ডের নিচে বা উপরে নন-অবস্ট্রুসিভ স্টিকি বার এবং লবিতে।', 'গেম খেলায় বিঘ্ন না ঘটিয়ে হাই CTR ও লাগাতার ইমপ্রেশন।'],
    ['Vignette Ads (Interstitial)', 'প্রতি ম্যাচ শেষ হয়ে পরের ম্যাচে যাওয়ার মাঝে এবং লেভেল মেনু ট্রানজিশনে।', 'ফুলস্ক্রিন ভিউ হওয়ায় সর্বোচ্চ eCPM রেট পাওয়া যায়।'],
    ['Rewarded / Video Ads', '৩টি ম্যাচ হারের পর রিভাইভ (ভিডিও দেখে চান্স রিকভার) অথবা টাকা ক্লেম করার মুহূর্তে।', 'ইউজারদের আগ্রহে হাই ভিডিও রেভিনিউ নিশ্চিত হবে।']
]

for row in ad_table.rows:
    row.cells[0].width = Inches(1.8)
    row.cells[1].width = Inches(2.6)
    row.cells[2].width = Inches(2.4)

for i, h_text in enumerate(ad_headers):
    cell = ad_table.cell(0, i)
    set_cell_background(cell, '047857')
    set_cell_margins(cell, 120, 120, 140, 140)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(h_text)
    run.font.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)
    run.font.size = Pt(10)

for r_idx, row_data in enumerate(ad_data):
    for c_idx, cell_data in enumerate(row_data):
        cell = ad_table.cell(r_idx + 1, c_idx)
        bg = 'F8FAFC' if r_idx % 2 == 0 else 'FFFFFF'
        set_cell_background(cell, bg)
        set_cell_margins(cell, 100, 100, 140, 140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(cell_data)
        run.font.size = Pt(9.5)
        if c_idx == 0:
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = Pt(4)

# Section 6: Roadmap
add_header('৬. ডেভেলপমেন্ট রোডম্যাপ (Development Roadmap)', level=1)
steps = [
    ('ধাপ ১: UI ও লেআউট আর্কিটেকচার', 'মোবাইল রেসপনসিভ লবি, গেম মোড ও লেভেল স্ট্যাটাস ইন্টারফেস।'),
    ('ধাপ ২: লুডু ও সাপ-লুডু ইঞ্জিন', 'ডাইস রোল, গুটি চালনা, স্টার সেফ জোন, সাপ ও মইয়ের রুলস তৈরি।'),
    ('ধাপ ৩: এআই ও ডিফিকাল্টি অ্যালগরিদম', 'Easy থেকে Never-Won ডিফিকাল্টি এবং ডাইস কন্ট্রোল সিস্টেম।'),
    ('ধাপ ৪: লেভেল রিসেট ও রিওয়ার্ড ওয়ালেট', '১০ ম্যাচে ৮ জয় / ৩ হারে Level 1 এ রিসেট লজিক এবং উইথড্রয়াল পেজ।'),
    ('ধাপ ৫: Moneytag অ্যাড স্ক্রিপ্ট ইন্টিগ্রেশন', 'In-page push, vignette ও video ad হ্যান্ডলার যোগ করা।')
]

for title, desc in steps:
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(2)
    r1 = sp.add_run(f'✔ {title}: ')
    r1.bold = True
    r1.font.color.rgb = RGBColor(30, 64, 175)
    r2 = sp.add_run(desc)
    r2.font.size = Pt(9.5)

output_path = r'c:\Users\tanvi\Downloads\Personal Workspace\Lodu Take\Ludo_Game_Implementation_Plan.docx'
doc.save(output_path)
print("DOCX_GENERATED_SUCCESSFULLY")
