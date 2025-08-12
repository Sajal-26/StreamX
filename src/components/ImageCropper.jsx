import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from '../styles/Profile.module.css';
import { Crop, X } from 'lucide-react';

// Function to get the cropped image data
function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/jpeg'));
  });
}


const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // Aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const handleCrop = async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      const croppedImageUrl = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'newFile.jpeg'
      );
      onCropComplete(croppedImageUrl);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.cropperModalContent}>
        <button className={styles.closeButton} onClick={onCancel}>
          <X size={24} />
        </button>
        <h2 className={styles.cropperTitle}>Crop Your Photo</h2>
        <div className={styles.cropContainer}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img ref={imgRef} alt="Crop me" src={imageSrc} onLoad={onImageLoad} />
          </ReactCrop>
        </div>
        <button onClick={handleCrop} className={styles.cropButton}>
          <Crop size={18} /> Crop and Save
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;