// components/SkeletonCard.js — Loading shimmer card matching SourceGroup shape
import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonHeader}>
        <div className={`${styles.skeletonLine} ${styles.w60}`} />
        <div className={styles.skeletonBadge} />
      </div>
      {[0.55, 0.40, 0.65].map((w, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeletonLine} style={{ width: `${w * 100}%` }} />
        </div>
      ))}
    </div>
  );
}
