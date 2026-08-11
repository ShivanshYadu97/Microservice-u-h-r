from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)


OUT = "output/resume/Shivansh_Yadu_Java_Full_Stack_Resume.pdf"


BLUE = colors.HexColor("#1F4E79")
TEXT = colors.HexColor("#202020")
MUTED = colors.HexColor("#555555")
LIGHT_BLUE = colors.HexColor("#EEF3F8")
RULE = colors.HexColor("#D9E2F3")


def esc(text):
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            "Name",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=21,
            alignment=TA_CENTER,
            textColor=BLUE,
            spaceAfter=1,
        )
    )
    base.add(
        ParagraphStyle(
            "Contact",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=11,
            alignment=TA_CENTER,
            textColor=MUTED,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            "Headline",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12.5,
            alignment=TA_CENTER,
            textColor=TEXT,
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            "Section",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.8,
            leading=13,
            textColor=BLUE,
            spaceBefore=7,
            spaceAfter=4,
            borderWidth=0.5,
            borderColor=RULE,
            borderPadding=(0, 0, 2, 0),
        )
    )
    base.add(
        ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=11.2,
            textColor=TEXT,
            spaceAfter=3,
        )
    )
    base.add(
        ParagraphStyle(
            "Role",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=TEXT,
            spaceBefore=3,
            spaceAfter=1,
        )
    )
    base.add(
        ParagraphStyle(
            "Meta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=10.8,
            textColor=TEXT,
            spaceAfter=1,
        )
    )
    base.add(
        ParagraphStyle(
            "ResumeBullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=10.8,
            leftIndent=12,
            firstLineIndent=-7,
            textColor=TEXT,
            spaceAfter=1.8,
        )
    )
    base.add(
        ParagraphStyle(
            "CellLabel",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.8,
            leading=10.3,
            textColor=BLUE,
        )
    )
    base.add(
        ParagraphStyle(
            "Cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=10.3,
            textColor=TEXT,
        )
    )
    return base


def section(story, style, title):
    story.append(Paragraph(title.upper(), style["Section"]))


def bullet(story, style, text):
    story.append(Paragraph(f"- {esc(text)}", style["ResumeBullet"]))


def role(story, style, title, company, location, dates, project, tech, bullets):
    block = []
    block.append(
        Paragraph(
            f"{esc(title)} | {esc(company)} | <font color='#555555'>{esc(location)}</font> | {esc(dates)}",
            style["Role"],
        )
    )
    block.append(Paragraph(f"<b>Project:</b> {esc(project)}", style["Meta"]))
    block.append(Paragraph(f"<b>Tech Stack:</b> {esc(tech)}", style["Meta"]))
    for item in bullets:
        block.append(Paragraph(f"- {esc(item)}", style["ResumeBullet"]))
    story.append(KeepTogether(block))


def build():
    style = styles()
    doc = SimpleDocTemplate(
        OUT,
        pagesize=letter,
        rightMargin=0.58 * inch,
        leftMargin=0.58 * inch,
        topMargin=0.52 * inch,
        bottomMargin=0.5 * inch,
        title="Shivansh Yadu - Java Full Stack Resume",
        author="Shivansh Yadu",
    )
    story = []

    story.append(Paragraph("SHIVANSH YADU", style["Name"]))
    story.append(Paragraph("Mumbai, India | +91 9340348901 | shivanshyadu9340@gmail.com", style["Contact"]))
    story.append(
        Paragraph(
            "Java Full Stack Developer | Spring Boot | Angular | REST APIs | Hibernate/JPA | MySQL/PostgreSQL",
            style["Headline"],
        )
    )

    section(story, style, "Profile Summary")
    story.append(
        Paragraph(
            "Java Full Stack Developer with 2.3 years of experience building web applications using Java, Spring Boot, Angular, TypeScript, Hibernate/JPA, RESTful APIs, and relational databases. Strong understanding of OOP, Java 8 features, layered MVC architecture, API integration, authentication/authorization using Spring Security and JWT, and database operations with MySQL and PostgreSQL. Comfortable working with Git, Maven, Postman, Swagger, debugging tools, and deployment basics on AWS.",
            style["Body"],
        )
    )

    section(story, style, "Technical Skills")
    rows = [
        ("Backend", "Java, Java 8, Spring Boot, Spring MVC, RESTful APIs, Hibernate/JPA, JDBC, Servlets, JSP"),
        ("Frontend", "Angular, TypeScript, RxJS, jQuery, HTML, Bootstrap, Tailwind CSS"),
        ("Database", "MySQL, PostgreSQL, Oracle, HQL"),
        ("Security & Cloud", "Spring Security, JWT authentication, AWS basics, Checkmarx"),
        ("Tools", "Git/GitHub, Maven, Postman, Swagger UI, IntelliJ IDEA, Eclipse, STS, VS Code, MySQL Workbench"),
    ]
    table = Table(
        [[Paragraph(esc(k), style["CellLabel"]), Paragraph(esc(v), style["Cell"])] for k, v in rows],
        colWidths=[1.25 * inch, 6.0 * inch],
        hAlign="LEFT",
        repeatRows=0,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.35, RULE),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, RULE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(table)

    section(story, style, "Work Experience")
    role(
        story,
        style,
        "Java Developer",
        "Housing.com Pvt Ltd",
        "Mumbai",
        "Feb 2025 - Present",
        "Zillow Scraper / Real Estate Web Application",
        "Java, Spring Boot, Angular, TypeScript, Hibernate/JPA, MySQL, REST Template, MVC Architecture",
        [
            "Developed Spring Boot and Angular features for property listings, search, user authentication, and role-based access for owners and buyers.",
            "Integrated REST APIs and backend services to support property data retrieval, filtering, and management workflows.",
            "Built admin-side listing and filter features to make property management faster and easier for internal users.",
            "Used Hibernate/JPA with MySQL for persistence, query handling, and database operations.",
            "Collaborated with a 7-member team across requirement understanding, feature development, debugging, and delivery.",
        ],
    )
    role(
        story,
        style,
        "Java Full Stack Developer",
        "TransUnion CIBIL",
        "Mumbai",
        "May 2024 - Jan 2025",
        "SSO Integration Application",
        "Java, Spring Boot, Angular, TypeScript, Hibernate/JPA, PostgreSQL, Bootstrap, jQuery, MVC Architecture",
        [
            "Developed and launched an SSO integration application that consumed multiple APIs and retrieved user data across five databases.",
            "Implemented backend flows for new user registration, existing user verification, and single sign-on enablement.",
            "Built RESTful APIs using Spring Boot and Hibernate/JPA, following controller, service, and repository layering.",
            "Worked on Angular and TypeScript UI components with Bootstrap and jQuery for user-facing verification flows.",
            "Supported authentication and authorization implementation using Spring Security and JWT tokens.",
        ],
    )

    section(story, style, "Key Responsibilities")
    for item in [
        "Designed and implemented REST controllers, service-layer logic, repository operations, and validation flows in Spring Boot.",
        "Worked with Java 8 features including lambdas, streams, collections, string handling, and OOP principles.",
        "Prepared API documentation and testing flows using Swagger UI and Postman.",
        "Used Maven for dependency management and Git/GitHub for version control.",
        "Debugged defects using IntelliJ IDEA, Eclipse, STS, and application logs.",
    ]:
        bullet(story, style, item)

    section(story, style, "Education")
    story.append(
        Paragraph(
            "<b>B.Tech</b> | Chhattisgarh Swami Vivekananda Technical University, Bhilai | CGPA: 8.1",
            style["Body"],
        )
    )

    doc.build(story)


if __name__ == "__main__":
    build()
