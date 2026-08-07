import { ImageGallery } from "../../../modules/ai-image-studio/components/ImageGallery.js";

export const metadata = {
  title: "Galería de Imágenes IA — GanaderoSG",
  description: "Todas las imágenes generadas por los especialistas IA de tu finca.",
};

export default function GaleriaIAPage() {
  return (
    <div style={{ height: "100dvh", overflow: "hidden" }}>
      <ImageGallery />
    </div>
  );
}
