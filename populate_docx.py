import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

template_path = r'C:\Users\Sriram\.gemini\antigravity\scratch\online-shopping-dba\DBA-Template.docx'
output_path = r'C:\Users\Sriram\.gemini\antigravity\scratch\online-shopping-dba\Online_Shopping_Database_Report.docx'

doc = docx.Document(template_path)

# Update Title if paragraph contains "Hackathon Title Here"
for p in doc.paragraphs:
    if 'Hackathon Title Here' in p.text:
        p.text = 'Online Shopping Relational Database & Full-Stack System'
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(22)
        p.runs[0].font.color.rgb = RGBColor(180, 0, 0)

# Table 0: Student Details
# Student Name, Register Number, Department, ID, College, Date, GitHub, Deployment
t0 = doc.tables[0]
if len(t0.rows) >= 8:
    t0.rows[5].cells[1].text = 'September 23, 2026'
    t0.rows[6].cells[1].text = 'https://github.com/your-username/online-shopping-dba'
    t0.rows[7].cells[1].text = 'http://localhost:5000 (Live Web Application)'

# Table 1: Tables Used
t1 = doc.tables[1]
# Clear existing data rows except header
while len(t1.rows) > 1:
    t1._tbl.remove(t1.rows[1]._tr)

tables_info = [
    ('CATEGORIES', 'Stores product classification categories, supporting hierarchical category trees'),
    ('CUSTOMERS', 'Stores customer profiles, contact numbers, email addresses, and delivery coordinates'),
    ('PRODUCTS', 'Stores physical product catalog, SKUs, sales prices, and live stock levels'),
    ('ORDERS', 'Tracks financial checkout transactions, timestamps, and order fulfillment lifecycle'),
    ('ORDER_ITEMS', 'Associative table storing individual line items, quantities, and prices per order'),
    ('AUDIT_LOGS', 'Change Data Capture (CDC) table recording DBA audit trails on inventory mutations')
]

for name, desc in tables_info:
    row = t1.add_row()
    row.cells[0].text = name
    row.cells[1].text = desc

# Table 2: Technologies Used
t2 = doc.tables[2]
while len(t2.rows) > 1:
    t2._tbl.remove(t2.rows[1]._tr)

tech_info = [
    ('Oracle Database 21c XE', 'Relational database management system (Enterprise PDB: XEPDB1)'),
    ('Oracle SQL*Plus', 'Database administration, schema deployment, and query execution'),
    ('SQL & PL/SQL', 'DDL/DML definitions, views, triggers, and atomic order transaction packages'),
    ('Node.js & Express.js', 'REST API backend, connection pool manager, and transaction controller'),
    ('node-oracledb (Thin Mode)', 'High-performance native driver connecting via TCP port 1521'),
    ('React 18 & Vite', 'Interactive storefront, customer order history UI, and DBA command center'),
    ('Tailwind CSS', 'Responsive modern UI design and utility-first styling')
]

for tech, purpose in tech_info:
    row = t2.add_row()
    row.cells[0].text = tech
    row.cells[1].text = purpose

# Table 3: Constraints and Relationships
t3 = doc.tables[3]
while len(t3.rows) > 1:
    t3._tbl.remove(t3.rows[1]._tr)

constraints_info = [
    ('CATEGORIES', 'category_id', 'parent_category_id -> CATEGORIES(category_id)', 'category_name NOT NULL UNIQUE, is_active CHECK (0, 1)'),
    ('CUSTOMERS', 'customer_id', 'None', 'first_name NOT NULL, last_name NOT NULL, email NOT NULL UNIQUE, status CHECK (ACTIVE, SUSPENDED, INACTIVE)'),
    ('PRODUCTS', 'product_id', 'category_id -> CATEGORIES(category_id)', 'sku NOT NULL UNIQUE, name NOT NULL, price CHECK (>= 0), stock_quantity CHECK (>= 0)'),
    ('ORDERS', 'order_id', 'customer_id -> CUSTOMERS(customer_id)', 'order_date NOT NULL, total_amount CHECK (>= 0), status CHECK (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)'),
    ('ORDER_ITEMS', 'order_item_id', 'order_id -> ORDERS(order_id), product_id -> PRODUCTS(product_id)', 'quantity CHECK (> 0), unit_price CHECK (>= 0), subtotal CHECK (>= 0), ON DELETE CASCADE on order_id')
]

for tbl, pk, fk, other in constraints_info:
    row = t3.add_row()
    row.cells[0].text = tbl
    row.cells[1].text = pk
    row.cells[2].text = fk
    row.cells[3].text = other

# Paragraph Text Replacements
replacements = [
    ('Vehicle Service Management Database', 'Online Shopping Database (E-Commerce System)'),
    ('vehicle service center', 'online shopping e-commerce system'),
    ('vehicle service', 'e-commerce shopping'),
    ('vehicle_service_db', 'ECOMMERCE_DBA'),
    ('MySQL Workbench', 'Oracle SQL*Plus & DBA Console'),
    ('MySQL', 'Oracle Database 21c'),
    ('A vehicle service center needs an efficient database system to manage information about customers, their vehicles, and the services performed on those vehicles.',
     'An e-commerce business requires an efficient relational database system to manage information about customers, product catalogs, customer purchase orders, order line items, and customer order history.'),
    ('Maintaining these details manually can make it difficult to track service history, retrieve customer information, and calculate service-related costs.',
     'Managing high-volume online shopping manually makes it difficult to track inventory, retrieve customer order history, and ensure transaction consistency.'),
    ('Consider a customer visiting a vehicle service center with a car.',
     'Consider a shopper browsing an online store to buy computing products and accessories.'),
    ('The customer represents the person who owns the vehicle.',
     'The customer represents the registered shopper with billing and shipping profiles.'),
    ("The vehicle represents the customer's car or two-wheeler.",
     'The product represents the item available for purchase with SKU and warehouse stock levels.'),
    ('The service represents the maintenance or repair work performed on that vehicle.',
     'The order and order items represent the purchase transaction and individual products bought.')
]

for p in doc.paragraphs:
    for old_str, new_str in replacements:
        if old_str in p.text:
            p.text = p.text.replace(old_str, new_str)

# Save Document
doc.save(output_path)
print('Successfully generated populated Word document at:', output_path)
