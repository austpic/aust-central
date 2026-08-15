import 'package:flutter/material.dart';

import 'package:aust_track/theme/app_colors.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';

class LabReportScreen extends StatefulWidget {
  const LabReportScreen({super.key});

  @override
  State<LabReportScreen> createState() => _LabReportScreenState();
}

class _LabReportScreenState extends State<LabReportScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController courseNoController = TextEditingController();
  final TextEditingController courseNameController = TextEditingController();
  final TextEditingController assignmentNoController = TextEditingController();
  final TextEditingController performanceDateController = TextEditingController();
  final TextEditingController submissionDateController = TextEditingController();
  final TextEditingController submittedToController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController idController = TextEditingController();
  final TextEditingController groupController = TextEditingController();
  final TextEditingController sectionController = TextEditingController();

  @override
  void dispose() {
    courseNoController.dispose();
    courseNameController.dispose();
    assignmentNoController.dispose();
    performanceDateController.dispose();
    submissionDateController.dispose();
    submittedToController.dispose();
    nameController.dispose();
    idController.dispose();
    groupController.dispose();
    sectionController.dispose();
    super.dispose();
  }

  Future<void> pickDate(TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      final String day = picked.day.toString().padLeft(2, '0');
      final List<String> months = <String>[
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      final String formatted = '$day ${months[picked.month - 1]}, ${picked.year}';
      setState(() {
        controller.text = formatted;
      });
    }
  }

  /// Current form contents, in the shape the API stores.
  Map<String, dynamic> get _draftFields => {
        'courseNo': courseNoController.text.trim(),
        'courseName': courseNameController.text.trim(),
        'assignmentNo': assignmentNoController.text.trim(),
        'performanceDate': performanceDateController.text.trim(),
        'submissionDate': submissionDateController.text.trim(),
        'submittedTo': submittedToController.text.trim(),
        'studentName': nameController.text.trim(),
        'studentId': idController.text.trim(),
        'group': groupController.text.trim(),
        'section': sectionController.text.trim(),
      };

  /// Id of the draft being edited, so repeated saves update rather than pile up.
  String? _draftId;
  bool _savingDraft = false;

  /// Save the form so the same cover page can be regenerated later without
  /// retyping ten fields. The PDF itself is still rendered on-device.
  Future<void> _saveDraft() async {
    if (_savingDraft) return;
    setState(() => _savingDraft = true);

    try {
      final saved = await context.read<AcademicRepository>()
          .saveLabReport(_draftFields, id: _draftId);
      if (!mounted) return;
      setState(() {
        _draftId = saved['id'] as String;
        _savingDraft = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Draft saved'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _savingDraft = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), behavior: SnackBarBehavior.floating),
      );
    }
  }

  void onPreviewPressed() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    showDialog(
      context: context,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Cover Page Preview', style: TextStyle(fontWeight: FontWeight.bold)),
              centerTitle: true,
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            body: PdfPreview(
              build: (format) => buildCoverPagePdf(
                courseNo: courseNoController.text.trim(),
                courseName: courseNameController.text.trim(),
                assignmentNo: assignmentNoController.text.trim(),
                performanceDate: performanceDateController.text.trim(),
                submissionDate: submissionDateController.text.trim(),
                submittedTo: submittedToController.text.trim(),
                name: nameController.text.trim(),
                id: idController.text.trim(),
                group: groupController.text.trim(),
                section: sectionController.text.trim(),
              ),
              canChangePageFormat: false,
              canChangeOrientation: false,
              canDebug: false,
              dynamicLayout: false,
              pdfFileName: 'cover_page.pdf',
            ),
          ),
        ),
      ),
    );
  }

  Widget buildTextField({
    required String label,
    required TextEditingController controller,
    bool isDateField = false,
    IconData? prefixIcon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        readOnly: isDateField,
        onTap: isDateField ? () => pickDate(controller) : null,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 20) : null,
          suffixIcon: isDateField ? const Icon(Icons.calendar_month, color: Color(0xFF407362)) : null,
        ),
        validator: (String? value) {
          if (value == null || value.trim().isEmpty) {
            return 'Please enter $label';
          }
          return null;
        },
      ),
    );
  }

  Widget buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 4,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF407362), Color(0xFF8CD4B8)],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: CgpaColors.lightAccent.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(icon, color: CgpaColors.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2C3E35),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ...children,
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Color primaryColor = CgpaColors.primary;
    final Color secondaryColor = CgpaColors.lightAccent;

    return Theme(
      data: Theme.of(context).copyWith(
        scaffoldBackgroundColor: CgpaColors.formBackground,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryColor,
          primary: primaryColor,
          secondary: secondaryColor,
          surface: CgpaColors.formBackground,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: CgpaColors.inputFill,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          labelStyle: TextStyle(color: Colors.grey.shade700, fontSize: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: primaryColor, width: 2),
          ),
        ),
      ),
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Cover Page Maker',
            style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              children: <Widget>[
                buildSectionCard(
                  title: 'Course Details',
                  icon: Icons.menu_book_rounded,
                  children: [
                    buildTextField(label: 'Course Number', controller: courseNoController, prefixIcon: Icons.tag),
                    buildTextField(label: 'Course Name', controller: courseNameController, prefixIcon: Icons.book),
                    buildTextField(label: 'Assignment Number', controller: assignmentNoController, prefixIcon: Icons.assignment_outlined),
                    buildTextField(
                      label: 'Date of Performance',
                      controller: performanceDateController,
                      isDateField: true,
                      prefixIcon: Icons.event_available,
                    ),
                    buildTextField(
                      label: 'Date of Submission',
                      controller: submissionDateController,
                      isDateField: true,
                      prefixIcon: Icons.event_note,
                    ),
                    buildTextField(label: 'Submitted To', controller: submittedToController, prefixIcon: Icons.person_outline),
                  ],
                ),
                buildSectionCard(
                  title: 'Student Details',
                  icon: Icons.person_pin_rounded,
                  children: [
                    buildTextField(label: 'Name', controller: nameController, prefixIcon: Icons.badge_outlined),
                    buildTextField(label: 'ID', controller: idController, prefixIcon: Icons.numbers),
                    buildTextField(label: 'Group', controller: groupController, prefixIcon: Icons.groups_outlined),
                    buildTextField(label: 'Section', controller: sectionController, prefixIcon: Icons.class_outlined),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton.icon(
                    onPressed: onPreviewPressed,
                    icon: const Icon(Icons.visibility_rounded, size: 22),
                    label: const Text(
                      'Preview Cover Page',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      elevation: 4,
                      shadowColor: primaryColor.withOpacity(0.4),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: _savingDraft ? null : _saveDraft,
                    icon: _savingDraft
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.bookmark_border_rounded, size: 20),
                    label: Text(
                      _draftId == null ? 'Save Draft' : 'Update Draft',
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: primaryColor,
                      side: BorderSide(color: primaryColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Future<Uint8List> buildCoverPagePdf({
  required String courseNo,
  required String courseName,
  required String assignmentNo,
  required String performanceDate,
  required String submissionDate,
  required String submittedTo,
  required String name,
  required String id,
  required String group,
  required String section,
}) async {
  final pw.Document doc = pw.Document();
  pw.Widget logoWidget;

  try {
    final ByteData logoBytes = await rootBundle.load('assets/images/aust_logo.jpeg');
    final pw.MemoryImage logoImage = pw.MemoryImage(logoBytes.buffer.asUint8List());
    logoWidget = pw.Image(logoImage, width: 90, height: 90);
  } catch (e) {
    logoWidget = pw.Container(
      width: 90,
      height: 90,
      color: PdfColors.grey300,
      alignment: pw.Alignment.center,
      child: pw.Text('AUST LOGO', style: const pw.TextStyle(fontSize: 10)),
    );
  }

  pw.Widget infoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 10),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: <pw.Widget>[
          pw.SizedBox(
            width: 150,
            child: pw.Text(label, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
          ),
          pw.Text(': ', style: const pw.TextStyle(fontSize: 12)),
          pw.Expanded(
            child: pw.Text(value, style: const pw.TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(40),
      build: (pw.Context context) {
        return pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: <pw.Widget>[
            pw.Center(child: logoWidget),
            pw.SizedBox(height: 16),
            pw.Container(
              width: double.infinity,
              color: PdfColors.black,
              padding: const pw.EdgeInsets.symmetric(vertical: 8),
              alignment: pw.Alignment.center,
              child: pw.Text(
                'Ahsanullah University of Science & Technology',
                style: pw.TextStyle(
                  color: PdfColors.white,
                  fontSize: 18,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.SizedBox(height: 6),
            pw.Center(
              child: pw.Text(
                'Department of Computer Science & Engineering',
                style: const pw.TextStyle(fontSize: 14),
              ),
            ),
            pw.SizedBox(height: 32),
            infoRow('Course No', courseNo),
            infoRow('Course Name', courseName),
            pw.SizedBox(height: 12),
            infoRow('Assignment No', assignmentNo),
            pw.SizedBox(height: 12),
            infoRow('Date of Performance', performanceDate),
            infoRow('Date of Submission', submissionDate),
            pw.SizedBox(height: 12),
            infoRow('Submitted To', submittedTo),
            pw.SizedBox(height: 32),
            pw.Text('Submitted by -', style: const pw.TextStyle(fontSize: 13)),
            pw.SizedBox(height: 14),
            pw.Padding(
              padding: const pw.EdgeInsets.only(left: 24),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: <pw.Widget>[
                  infoRow('Name', name),
                  infoRow('Id', id),
                  infoRow('Group', group),
                  infoRow('Section', section),
                ],
              ),
            ),
          ],
        );
      },
    ),
  );

  return doc.save();
}