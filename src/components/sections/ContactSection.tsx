"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Github, Linkedin, Instagram, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContactSection() {
  const t = useTranslations("software.SoftwareContactSection");
  // ... state and handlers remain the same
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const sectionRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setIsActive(latest > 0.2 && latest < 0.8);
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionStatus("submitting");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch(
        `https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_ID}`,
        {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        }
      );
      if (response.ok) {
        setSubmissionStatus("success");
      } else {
        setSubmissionStatus("error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmissionStatus("error");
    }
  };

  return (
    <section id="kontakt" ref={sectionRef}>
      <motion.div
        data-active={isActive}
        className={cn(
          "group rounded-xl p-8 md:p-12 transition-all duration-300",
          "data-[active=true]:bg-foreground data-[active=true]:shadow-2xl"
        )}
        animate={{ scale: isActive ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* ... Left Column remains the same */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold tracking-tight transition-colors duration-300 group-data-[active=true]:text-background">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground transition-colors duration-300 group-data-[active=true]:text-background/80">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex items-center justify-start gap-4">
              <p className="text-sm text-muted-foreground transition-colors duration-300 group-data-[active=true]:text-background/70">
                {t("socials_text")}
              </p>
              <a
                href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="h-6 w-6 text-muted-foreground transition-colors hover:text-foreground group-data-[active=true]:text-background/70 group-data-[active=true]:hover:text-background" />
              </a>
              <a
                href={`https://linkedin.com/in/${process.env.NEXT_PUBLIC_LINKEDIN_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-6 w-6 text-muted-foreground transition-colors hover:text-foreground group-data-[active=true]:text-background/70 group-data-[active=true]:hover:text-background" />
              </a>
              <a
                href={`https://instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6 text-muted-foreground transition-colors hover:text-foreground group-data-[active=true]:text-background/70 group-data-[active=true]:hover:text-background" />
              </a>
            </div>
          </motion.div>

          {/* Column 2: The Interactive Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {submissionStatus === "success" ? (
              // ... success message remains the same
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-foreground p-8 text-center h-[380px] transition-colors duration-300 group-data-[active=true]:border-background">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold transition-colors duration-300 group-data-[active=true]:text-background">
                  {t("success_title")}
                </h3>
                <p className="text-muted-foreground mt-2 transition-colors duration-300 group-data-[active=true]:text-background/80">
                  {t("success_message")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="name"
                    className="transition-colors duration-300 group-data-[active=true]:text-background"
                  >
                    {t("form_name")}
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    placeholder={t("form_name_placeholder")}
                    required
                    // --- THIS IS THE FIX ---
                    className="transition-colors duration-300 group-data-[active=true]:bg-transparent group-data-[active=true]:border-background group-data-[active=true]:text-background group-data-[active=true]:placeholder:text-background/50 group-data-[active=true]:focus-visible:ring-background"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="email"
                    className="transition-colors duration-300 group-data-[active=true]:text-background"
                  >
                    {t("form_email")}
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder={t("form_email_placeholder")}
                    required
                    // --- THIS IS THE FIX ---
                    className="transition-colors duration-300 group-data-[active=true]:bg-transparent group-data-[active=true]:border-background group-data-[active=true]:text-background group-data-[active=true]:placeholder:text-background/50 group-data-[active=true]:focus-visible:ring-background"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="message"
                    className="transition-colors duration-300 group-data-[active=true]:text-background"
                  >
                    {t("form_message")}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={t("form_message_placeholder")}
                    required
                    // --- THIS IS THE FIX ---
                    className="min-h-[100px] transition-colors duration-300 group-data-[active=true]:bg-transparent group-data-[active=true]:border-background group-data-[active=true]:text-background group-data-[active=true]:placeholder:text-background/50 group-data-[active=true]:focus-visible:ring-background"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full group-data-[active=true]:bg-transparent group-data-[active=true]:text-background group-data-[active=true]:border-background group-data-[active=true]:hover:bg-background group-data-[active=true]:hover:text-foreground"
                  disabled={submissionStatus === "submitting"}
                >
                  {submissionStatus === "submitting"
                    ? t("form_submitting")
                    : t("form_submit")}
                </Button>
                {submissionStatus === "error" && (
                  <p className="text-sm text-red-500 text-center">
                    {t("error_message")}
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
