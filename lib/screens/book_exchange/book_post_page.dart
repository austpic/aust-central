import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/app_colors.dart';

class BookPostPage extends StatefulWidget {
  const BookPostPage({super.key});

  @override
  State<BookPostPage> createState() => _BookPostPageState();
}

class _BookPostPageState extends State<BookPostPage> {
  final _titleController = TextEditingController(text: 'Introduction to Botany');
  final _courseController = TextEditingController(text: 'BIO 150');
  final _descriptionController = TextEditingController(
    text:
    'Light highlighting on Chapter 3. Otherwise pages are crisp and binding is solid. Looking to swap for CHEM 201 textbook!',
  );

  static const Set<String> _knownCourseCodes = {'BIO 150', 'CHEM 201', 'CSE 101'};

  int _conditionIndex = 1; // New, Like New, Good, Fair
  int _priceTypeIndex = 2; // Fixed Price, Free, Swap
  bool _contactViaChat = true;

  // Image Upload State
  File? _coverImage;
  final List<File> _additionalImages = [];
  final ImagePicker _picker = ImagePicker();

  bool get _courseMatched =>
      _knownCourseCodes.contains(_courseController.text.trim().toUpperCase());

  @override
  void dispose() {
    _titleController.dispose();
    _courseController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------
  // Image Selection Logic
  // ---------------------------------------------------------------------

  Future<void> _selectImage({required bool isCover, required ImageSource source}) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          if (isCover) {
            _coverImage = File(pickedFile.path);
          } else {
            _additionalImages.add(File(pickedFile.path));
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  void _showImageSourcePicker({required bool isCover}) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.photo_library, color: AppColors.darkGreen),
                  title: const Text('Choose from Gallery'),
                  onTap: () {
                    Navigator.pop(context);
                    _selectImage(isCover: isCover, source: ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.camera_alt, color: AppColors.darkGreen),
                  title: const Text('Take a Photo'),
                  onTap: () {
                    Navigator.pop(context);
                    _selectImage(isCover: isCover, source: ImageSource.camera);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(context),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                children: [
                  _buildPhotoPickersRow(),
                  const SizedBox(height: 24),
                  _sectionLabel('Book Title'),
                  const SizedBox(height: 8),
                  _plainField(controller: _titleController, hint: 'Book title'),
                  const SizedBox(height: 20),
                  _sectionLabel('Course Code (autocomplete)'),
                  const SizedBox(height: 8),
                  _courseCodeField(),
                  const SizedBox(height: 20),
                  _sectionLabel('Condition'),
                  const SizedBox(height: 10),
                  _segmentedControl(
                    options: const ['New', 'Like New', 'Good', 'Fair'],
                    selectedIndex: _conditionIndex,
                    onChanged: (i) => setState(() => _conditionIndex = i),
                  ),
                  const SizedBox(height: 20),
                  _sectionLabel('Price Type'),
                  const SizedBox(height: 10),
                  _segmentedControl(
                    options: const ['Fixed Price', 'Free', 'Swap'],
                    selectedIndex: _priceTypeIndex,
                    onChanged: (i) => setState(() => _priceTypeIndex = i),
                  ),
                  const SizedBox(height: 20),
                  _sectionLabel('Description'),
                  const SizedBox(height: 8),
                  _plainField(
                    controller: _descriptionController,
                    hint: 'Add condition notes, what you\'re looking to swap for, etc.',
                    maxLines: 4,
                  ),
                  const SizedBox(height: 20),
                  _buildChatToggleRow(),
                ],
              ),
            ),
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------
  // Top bar
  // ---------------------------------------------------------------------

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 20, 8),
      child: SizedBox(
        height: 40,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: GestureDetector(
                onTap: () => Navigator.of(context).maybePop(),
                child: const Padding(
                  padding: EdgeInsets.all(8),
                  child: Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: AppColors.darkGreen,
                    size: 20,
                  ),
                ),
              ),
            ),
            const Text(
              'POST A BOOK',
              style: TextStyle(
                color: AppColors.darkGreen,
                fontWeight: FontWeight.w800,
                fontSize: 18,
                letterSpacing: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------
  // Photo pickers
  // ---------------------------------------------------------------------

  Widget _buildPhotoPickersRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          // Cover Photo Box or Preview
          if (_coverImage != null)
            Padding(
              padding: const EdgeInsets.only(right: 14),
              child: _ImagePreviewBox(
                file: _coverImage!,
                isCover: true,
                onRemove: () => setState(() => _coverImage = null),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(right: 14),
              child: _DashedPhotoBox(
                onTap: () => _showImageSourcePicker(isCover: true),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.camera_alt_outlined, color: AppColors.darkGreen, size: 22),
                    SizedBox(height: 8),
                    Text(
                      'Add Cover',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Additional Photos List
          ..._additionalImages.map((file) {
            return Padding(
              padding: const EdgeInsets.only(right: 14),
              child: _ImagePreviewBox(
                file: file,
                isCover: false,
                onRemove: () => setState(() => _additionalImages.remove(file)),
              ),
            );
          }),

          // Add Extra Photos Button
          _DashedPhotoBox(
            onTap: () => _showImageSourcePicker(isCover: false),
            child: const Icon(Icons.add_rounded, color: AppColors.darkGreen, size: 26),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------
  // Fields
  // ---------------------------------------------------------------------

  Widget _sectionLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: Color(0xff1C1C1C),
      ),
    );
  }

  Widget _plainField({
    required TextEditingController controller,
    required String hint,
    int maxLines = 1,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: maxLines > 1 ? 14 : 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.mintSection),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(fontSize: 14, color: Color(0xff1C1C1C)),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.black38, fontSize: 14),
          border: InputBorder.none,
          isDense: true,
          contentPadding: EdgeInsets.symmetric(vertical: maxLines > 1 ? 0 : 14),
        ),
        onChanged: (_) => setState(() {}),
      ),
    );
  }

  Widget _courseCodeField() {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.mintSection),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _courseController,
              style: const TextStyle(fontSize: 14, color: Color(0xff1C1C1C)),
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                hintText: 'e.g. CHEM 201',
                hintStyle: TextStyle(color: Colors.black38, fontSize: 14),
                border: InputBorder.none,
                isDense: true,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          if (_courseMatched)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.mintChip,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Matched',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.darkGreen,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------
  // Segmented control (Condition / Price Type)
  // ---------------------------------------------------------------------

  Widget _segmentedControl({
    required List<String> options,
    required int selectedIndex,
    required ValueChanged<int> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: AppColors.mintSection),
      ),
      child: Row(
        children: List.generate(options.length, (index) {
          final bool selected = index == selectedIndex;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 2),
                padding: const EdgeInsets.symmetric(vertical: 10),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? AppColors.darkGreen : Colors.transparent,
                  borderRadius: BorderRadius.circular(26),
                ),
                child: Text(
                  options[index],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : Colors.black45,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ---------------------------------------------------------------------
  // Contact via chat toggle
  // ---------------------------------------------------------------------

  Widget _buildChatToggleRow() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Contact via In-App Chat',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xff1C1C1C),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Recommended for safety',
                style: TextStyle(fontSize: 12, color: Colors.black.withOpacity(0.45)),
              ),
            ],
          ),
        ),
        Switch(
          value: _contactViaChat,
          onChanged: (v) => setState(() => _contactViaChat = v),
          activeColor: Colors.white,
          activeTrackColor: AppColors.darkGreen,
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------
  // Bottom action bar
  // ---------------------------------------------------------------------

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
      decoration: const BoxDecoration(
        color: AppColors.scaffoldBackground,
        border: Border(top: BorderSide(color: AppColors.mintSection)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.darkGreen,
                  side: const BorderSide(color: AppColors.darkGreen, width: 1.4),
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                ),
                child: const Text('Save Draft', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  // Access files via `_coverImage` and `_additionalImages`
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.darkGreen,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                ),
                child: const Text('Post Listing', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------
// Helper Widgets & Painters
// ---------------------------------------------------------------------

class _DashedPhotoBox extends StatelessWidget {
  const _DashedPhotoBox({required this.onTap, required this.child});

  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 100,
        height: 116,
        child: CustomPaint(
          painter: _DashedRRectPainter(
            color: AppColors.darkGreen.withOpacity(0.35),
            radius: 16,
          ),
          child: Center(child: child),
        ),
      ),
    );
  }
}

class _ImagePreviewBox extends StatelessWidget {
  final File file;
  final bool isCover;
  final VoidCallback onRemove;

  const _ImagePreviewBox({
    required this.file,
    required this.isCover,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 100,
      height: 116,
      child: Stack(
        fit: StackFit.expand,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.file(
              file,
              fit: BoxFit.cover,
            ),
          ),
          if (isCover)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                ),
                child: const Text(
                  'Cover',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 14, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedRRectPainter extends CustomPainter {
  _DashedRRectPainter({required this.color, required this.radius});

  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0.6, 0.6, size.width - 1.2, size.height - 1.2),
      Radius.circular(radius),
    );
    final path = Path()..addRRect(rrect);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;

    const dashWidth = 5.0;
    const dashGap = 4.0;

    for (final metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final next = distance + dashWidth;
        canvas.drawPath(
          metric.extractPath(distance, next.clamp(0, metric.length)),
          paint,
        );
        distance = next + dashGap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DashedRRectPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.radius != radius;
}