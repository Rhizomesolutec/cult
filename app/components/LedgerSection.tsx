"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LedgerScrub, type LedgerMode } from "./LedgerScrub";
import styles from "./LedgerSection.module.css";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function LedgerSection() {
  const [mode, setMode] = useState<LedgerMode>("problem");
  const reduceMotion = useReducedMotion();

  const headerParent = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };

  const headerChild = {
    hidden: reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 22, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduceMotion ? 0.01 : 0.65, ease: easeOut },
    },
  };

  const panelTransition = {
    duration: reduceMotion ? 0.15 : 0.38,
    ease: easeOut,
  };

  const panelAnimate = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, x: 0, filter: "blur(0px)", scale: 1 };

  const problemInitial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, x: -18, filter: "blur(10px)", scale: 0.985 };
  const solutionInitial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 18, filter: "blur(10px)", scale: 0.985 };

  /** Problem panel exits right / blurs when switching to solution */
  const exitProblem = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 20, filter: "blur(10px)" };
  /** Solution panel exits left / blurs when switching to problem */
  const exitSolution = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, x: -20, filter: "blur(10px)" };

  return (
    <section id="ledger" className={styles.ledger} aria-labelledby="ledger-title">
      <div className={styles.ledgerGlow} aria-hidden />
      <div className={styles.ledgerGrid} aria-hidden />
      <div className={styles.ledgerInner}>
        <motion.div
          variants={headerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-72px 0px", amount: 0.2 }}
        >
          <motion.p className={styles.eyebrow} variants={headerChild}>
            The ledger
          </motion.p>
          <motion.h2 id="ledger-title" className={styles.title} variants={headerChild}>
            Truth on one side. Legacy on the other.
          </motion.h2>
          <motion.p className={styles.lead} variants={headerChild}>
            Drag the seal, or choose a side — the tension Cult Scribe exists to
            resolve.
          </motion.p>
        </motion.div>

        <div className={styles.controls}>
          <div className={styles.toggle}>
            <button
              type="button"
              onClick={() => setMode("problem")}
              className={`${styles.toggleBtn} ${
                mode === "problem" ? styles.toggleBtnActiveProblem : ""
              }`}
            >
              The problem
            </button>
            <button
              type="button"
              onClick={() => setMode("solution")}
              className={`${styles.toggleBtn} ${
                mode === "solution" ? styles.toggleBtnActiveSolution : ""
              }`}
            >
              The solution
            </button>
          </div>

          <LedgerScrub value={mode} onChange={setMode} />
        </div>

        <div className={styles.panelWrap}>
          <AnimatePresence mode="wait">
            {mode === "problem" ? (
              <motion.div
                key="problem"
                initial={problemInitial}
                animate={panelAnimate}
                exit={exitProblem}
                transition={panelTransition}
                className={styles.panelGlass}
              >
                <h3 className={styles.panelTitleProblem}>
                  Most stationery is soulless.
                </h3>
                <ul className={styles.list}>
                  <li>Generic by design — zero cultural depth.</li>
                  <li>Creativity tools that don&apos;t inspire.</li>
                  <li>No identity, no story, no emotional pull.</li>
                  <li>
                    The things we love — music, art, rebellion — are nowhere to
                    be found.
                  </li>
                </ul>
              </motion.div>
            ) : (
              <motion.div
                key="solution"
                initial={solutionInitial}
                animate={panelAnimate}
                exit={exitSolution}
                transition={panelTransition}
                className={`${styles.panelGlass} ${styles.panelSolution}`}
              >
                <h3 className={styles.panelTitleSolution}>
                  Notebooks with a legacy.
                </h3>
                <ul className={`${styles.list} ${styles.listLight}`}>
                  <li>Cultural and musical depth in every line.</li>
                  <li>Each cover is a piece of history.</li>
                  <li>Built to inspire bold expression.</li>
                  <li>
                    Every detail carries meaning — from texture to typography.
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
