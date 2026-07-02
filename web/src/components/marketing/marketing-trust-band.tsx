import { motion } from 'framer-motion'
import { PUBLIC_TRUST_ITEMS } from '@/config/public-marketing'
import { useMarketingMotion } from '@/components/marketing/marketing-motion'

/** Neutral trust band — no fake logos, metrics, or testimonials. */
export function MarketingTrustBand() {
  const { fadeUp, staggerContainer, staggerItem, viewport } = useMarketingMotion()

  return (
    <motion.section
      className="mkt-trust-band"
      aria-label="Platform principles"
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeUp}
    >
      <div className="mkt-trust-band-inner">
        <header className="mkt-trust-band-header">
          <p className="mkt-eyebrow">Built for construction collaboration teams</p>
          <h2 className="mkt-trust-band-title">
            A credible foundation for multi-party built-environment work.
          </h2>
        </header>

        <motion.div
          className="mkt-trust-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {PUBLIC_TRUST_ITEMS.map((item) => (
            <motion.article key={item.title} className="mkt-trust-card" variants={staggerItem}>
              <i className={item.icon} aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
