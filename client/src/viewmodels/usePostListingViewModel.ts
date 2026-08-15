import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

// Mirrors _BookPostPageState in lib/screens/book_exchange/book_post_page.dart
export const CONDITION_OPTIONS = ['New', 'Like New', 'Good', 'Fair'];
export const PRICE_TYPE_OPTIONS = ['Fixed Price', 'Free', 'Swap'];
export const KNOWN_COURSE_CODES = new Set(['BIO 150', 'CHEM 201', 'CSE 101']);

export function usePostListingViewModel() {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('Introduction to Botany');
  const [course, setCourse] = useState('BIO 150');
  const [description, setDescription] = useState(
    'Light highlighting on Chapter 3. Otherwise pages are crisp and binding is solid. Looking to swap for CHEM 201 textbook!',
  );
  const [conditionIndex, setConditionIndex] = useState(1);
  const [priceTypeIndex, setPriceTypeIndex] = useState(2);
  const [contactViaChat, setContactViaChat] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  const courseMatched = KNOWN_COURSE_CODES.has(course.trim().toUpperCase());

  function addCoverImage(dataUrl: string) {
    setCoverImage(dataUrl);
  }

  function removeCoverImage() {
    setCoverImage(null);
  }

  function addAdditionalImage(dataUrl: string) {
    setAdditionalImages((prev) => [...prev, dataUrl]);
  }

  function removeAdditionalImage(index: number) {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  }

  function saveDraft() {
    toast('Draft saved.', 'success');
    navigate(-1);
  }

  function postListing() {
    toast('Your listing has been posted!', 'success');
    navigate(-1);
  }

  return {
    title,
    setTitle,
    course,
    setCourse,
    description,
    setDescription,
    conditionOptions: CONDITION_OPTIONS,
    conditionIndex,
    setConditionIndex,
    priceTypeOptions: PRICE_TYPE_OPTIONS,
    priceTypeIndex,
    setPriceTypeIndex,
    contactViaChat,
    setContactViaChat,
    courseMatched,
    coverImage,
    addCoverImage,
    removeCoverImage,
    additionalImages,
    addAdditionalImage,
    removeAdditionalImage,
    saveDraft,
    postListing,
  };
}
