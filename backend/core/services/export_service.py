from io import BytesIO
import pandas as pd
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

class ExportService:
    @staticmethod
    def generate_excel(data, columns, column_labels):
        """
        Genera un archivo Excel a partir de una lista de diccionarios.
        data: List[dict]
        columns: List[str] - Claves en el diccionario
        column_labels: dict - Mapeo de clave a etiqueta legible
        """
        df = pd.DataFrame(data)
        if not df.empty:
            # Filtrar solo columnas solicitadas y renombrar
            df = df[columns]
            df.columns = [column_labels.get(c, c) for c in columns]
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Estudiantes')
        
        return output.getvalue()

    @staticmethod
    def generate_pdf(data, columns, column_labels, title="Reporte de Estudiantes"):
        """
        Genera un archivo PDF.
        """
        output = BytesIO()
        doc = SimpleDocTemplate(output, pagesize=landscape(letter))
        elements = []
        
        styles = getSampleStyleSheet()
        elements.append(Paragraph(title, styles['Title']))
        elements.append(Paragraph("<br/><br/>", styles['Normal']))

        # Preparar datos para la tabla
        header = [column_labels.get(c, c) for c in columns]
        table_data = [header]
        
        for row in data:
            table_row = []
            for col in columns:
                val = row.get(col, "")
                if val is None: val = ""
                # Si es una lista, la unimos con comas
                if isinstance(val, list):
                    val = ", ".join([str(v) for v in val])
                table_row.append(str(val))
            table_data.append(table_row)

        # Crear tabla
        # Ajustar ancho de columnas proporcionalmente (aproximado)
        t = Table(table_data, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.indigo),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(t)
        doc.build(elements)
        
        return output.getvalue()
