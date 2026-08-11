from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUT = Path("output/resume/Shivansh_Yadu_Java_Full_Stack_Resume.pdf")
BLUE = colors.HexColor("#1F4E79")
LIGHT_BLUE = colors.HexColor("#EAF2F8")
GRID = colors.HexColor("#D9E2EC")
TEXT = colors.HexColor("#222222")


def styles():
    base = getSampleStyleSheet()
    return {
        "name": ParagraphStyle(
            "Name",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=20,
            alignment=TA_CENTER,
            textColor=BLUE,
            spaceAfter=1,
        ),
        "title": ParagraphStyle(
            "TitleLine",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.4,
            leading=12,
            alignment=TA_CENTER,
            textColor=TEXT,
            spaceAfter=2,
        ),
        "contact": ParagraphStyle(
            "Contact",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=10.5,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#555555"),
            spaceAfter=5,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12,
            textColor=BLUE,
            borderWidth=0,
            borderPadding=0,
            spaceBefore=7,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.15,
            leading=10.7,
            textColor=TEXT,
            spaceAfter=2,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=10.1,
            textColor=TEXT,
            spaceAfter=1,
        ),
        "small_bold": ParagraphStyle(
            "SmallBold",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.9,
            leading=10.2,
            textColor=TEXT,
            spaceAfter=1,
        ),
        "date": ParagraphStyle(
            "Date",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.9,
            leading=10.2,
            alignment=TA_RIGHT,
            textColor=TEXT,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.9,
            leading=10.2,
            leftIndent=12,
            firstLineIndent=-7,
            textColor=TEXT,
            spaceAfter=1.5,
        ),
    }


def section(title, st):
    return [
        Paragraph(title.upper(), st["section"]),
        Table([[""]], colWidths=[7.35 * inch], rowHeights=[0.01 * inch], style=[
            ("LINEABOVE", (0, 0), (-1, -1), 0.7, BLUE),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]),
    ]


def bullet(text, st):
    return Paragraph(f"- {text}", st["bullet"])


def role(title, company, dates, location, tech, bullets, st):
    rows = [[Paragraph(f"<b>{title} | {company}</b>", st["small"]), Paragraph(dates, st["date"])]]
    table = Table(rows, colWidths=[5.05 * inch, 2.3 * inch])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story = [table]
    if location:
        story.append(Paragraph(f"<i>{location}</i>", st["small"]))
    story.append(Paragraph(f"<b>Tech:</b> {tech}", st["small"]))
    story.extend(bullet(item, st) for item in bullets)
    story.append(Spacer(1, 2))
    return KeepTogether(story)


def build_pdf():
    st = styles()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.42 * inch,
        bottomMargin=0.42 * inch,
    )

    story = [
        Paragraph("SHIVANSH YADU", st["name"]),
        Paragraph("Java Full Stack Developer | Spring Boot | Angular | REST APIs", st["title"]),
        Paragraph("Mumbai, India | +91 9340348901 | shivanshyadu9340@gmail.com", st["contact"]),
    ]

    story.extend(section("Profile Summary", st))
    story.append(Paragraph(
        "Java Full Stack Developer with 2.3 years of experience building web applications using "
        "Java 8, Spring Boot, REST APIs, Hibernate/JPA, Angular, TypeScript, MySQL and PostgreSQL. "
        "Hands-on with authentication and authorization flows using Spring Security and JWT, MVC "
        "architecture, API documentation with Swagger, Git-based collaboration and Maven-driven builds. "
        "Strong fit for Java Full Stack, Spring Boot Developer and Java Angular roles.",
        st["body"],
    ))

    story.extend(section("Technical Skills", st))
    skills = [
        ("Backend", "Java, Java 8, Spring Boot, RESTful APIs, Spring MVC, Spring Security, JWT, Hibernate/JPA, JDBC, HQL"),
        ("Frontend", "Angular, TypeScript, RxJS, JSP, jQuery, Bootstrap, Tailwind CSS, HTML templates"),
        ("Databases", "MySQL, PostgreSQL, Oracle"),
        ("Tools", "Git/GitHub, Maven, Postman, Swagger UI, IntelliJ IDEA, STS, Eclipse, VS Code, MySQL Workbench"),
        ("Other", "OOPs, Collections, Lambda, Streams, Design Patterns, Logging, AWS basics, Checkmarx"),
    ]
    skill_rows = [[Paragraph(f"<b>{label}</b>", st["small"]), Paragraph(text, st["small"])] for label, text in skills]
    skill_table = Table(skill_rows, colWidths=[1.05 * inch, 6.3 * inch])
    skill_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(skill_table)

    story.extend(section("Professional Experience", st))
    story.append(role(
        "Java Developer",
        "Housing.com Pvt. Ltd.",
        "Feb 2025 - Present",
        "",
        "Java, Spring Boot, Angular, TypeScript, Hibernate/JPA, MySQL, REST APIs, RestTemplate, MVC",
        [
            "Built and enhanced modules for a real-estate web application covering property listing, property search, user authentication and role-based access for owners, buyers and admin users.",
            "Developed Spring Boot REST APIs and Angular screens for property filters and admin workflows, improving backend task handling and day-to-day management operations.",
            "Worked with Hibernate/JPA and MySQL for persistence, query handling and data retrieval across property and user-management flows.",
            "Integrated internal and external REST APIs using RestTemplate and validated endpoints through Postman and Swagger UI.",
            "Collaborated in a 7-member team using Git/GitHub, Maven and IDE debugging to deliver feature fixes and application improvements.",
        ],
        st,
    ))
    story.append(role(
        "Java Full Stack Developer",
        "TransUnion CIBIL",
        "May 2024 - Jan 2025",
        "Mumbai",
        "Java, Spring Boot, Angular, TypeScript, Hibernate/JPA, PostgreSQL, Bootstrap, jQuery, MVC",
        [
            "Developed SSO integration features that consumed multiple APIs and supported user verification across five databases before enabling single sign-on access.",
            "Implemented REST controller, service and repository layers in Spring Boot with Hibernate/JPA and PostgreSQL for verification and user-data workflows.",
            "Built Angular, TypeScript, Bootstrap and jQuery-based UI components for registration, login verification and user-facing SSO flows.",
            "Supported authentication and authorization implementation using Spring Security and JWT-based access control.",
            "Prepared and tested API contracts with Swagger UI and Postman while coordinating with a 10-member engineering team.",
        ],
        st,
    ))

    story.extend(section("Core Responsibilities", st))
    for item in [
        "Designed and implemented REST APIs with request validation, layered Spring Boot architecture and database integration.",
        "Worked on database operations using Hibernate/JPA, JDBC, HQL, MySQL and PostgreSQL.",
        "Applied Java 8 features such as lambdas, streams and collections while writing maintainable application logic.",
        "Handled debugging, issue fixing, dependency management and Git-based version control in active development environments.",
    ]:
        story.append(bullet(item, st))

    story.extend(section("Education", st))
    edu = Table(
        [[
            Paragraph("<b>B.Tech - Chhattisgarh Swami Vivekanand Technical University, Bhilai</b>", st["small"]),
            Paragraph("<b>CGPA: 8.1</b>", st["date"]),
        ]],
        colWidths=[5.9 * inch, 1.45 * inch],
    )
    edu.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(edu)

    story.extend(section("Resume Keywords", st))
    story.append(Paragraph(
        "Java Full Stack Developer, Java Developer, Spring Boot Developer, Java Angular Developer, REST API Developer, "
        "Hibernate JPA, MySQL, PostgreSQL, Spring Security, JWT, Angular, TypeScript.",
        st["body"],
    ))

    doc.build(story)
    print(OUT.resolve())


if __name__ == "__main__":
    build_pdf()
