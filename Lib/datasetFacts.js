import { loadReviews } from "./retrieval/loadReviews.js";
import { normalizeText } from "./retrieval/format.js";

const TITLE_TOKENS = new Set(["dr", "prof", "professor"]);

function nameTokens(name) {
  return normalizeText(name)
    .split(" ")
    .filter((token) => token && !TITLE_TOKENS.has(token));
}

function firstName(name) {
  return nameTokens(name)[0] ?? "";
}

function lastName(name) {
  const tokens = nameTokens(name);
  return tokens[tokens.length - 1] ?? "";
}

function groupBy(reviews, keyFn) {
  const groups = new Map();

  for (const review of reviews) {
    const key = keyFn(review);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(review);
  }

  return [...groups.entries()].filter(([, items]) => items.length > 1);
}

function groupBySubject(reviews) {
  return groupBy(reviews, (review) => normalizeText(review.subject)).map(
    ([subject, items]) => ({
      subject,
      displaySubject: items[0].subject,
      professors: items.map((item) => item.professor),
      reviews: items,
    })
  );
}

export function extractSubjectFilter(query) {
  const text = normalizeText(query);

  const patterns = [
    /\bclass of\s+([a-z0-9 ]{3,60})/,
    /\b(?:course|subject|class|topic)\s+(?:of|on|about|for)\s+([a-z0-9 ]{3,60})/,
    /\b(?:course|subject|class|topic)\s+in\s+(?!total\b|the database\b|this dataset\b|the dataset\b)([a-z0-9 ]{3,60})/,
    /\b(?:teach(?:es|ing)?|have)\s+(?:a\s+)?(?:class|course|subject)?\s*(?:of|on|for)?\s+([a-z0-9 ]{3,60})/,
    /\bprofessors?\s+for\s+([a-z0-9 ]{3,60})/,
    /\bprofessors?\s+teaching\s+([a-z0-9 ]{3,60})/,
  ];

  const blockedPhrases = [
    "total",
    "the database",
    "this dataset",
    "the dataset",
    "our dataset",
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const subject = match[1]
        .trim()
        .replace(/\s+(in total|there are|do we have|are there).*$/i, "")
        .trim();

      if (!subject || blockedPhrases.some((phrase) => subject.startsWith(phrase))) {
        continue;
      }

      return subject;
    }
  }

  return null;
}

export function filterReviewsBySubject(reviews, subjectFilter) {
  const normalizedFilter = normalizeText(subjectFilter);
  const tokens = normalizedFilter.split(" ").filter((token) => token.length > 2);

  return reviews.filter((review) => {
    const subject = normalizeText(review.subject);
    if (subject.includes(normalizedFilter)) return true;
    if (tokens.length > 0 && tokens.every((token) => subject.includes(token))) return true;
    return false;
  });
}

export function buildDatasetSummary(reviews) {
  const exactDuplicates = groupBy(reviews, (review) => normalizeText(review.professor));
  const sharedFirstNames = groupBy(reviews, (review) => firstName(review.professor));
  const sharedLastNames = groupBy(reviews, (review) => lastName(review.professor));
  const duplicateSubjects = groupBySubject(reviews);
  const averageRating =
    reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length;

  return {
    totalProfessors: reviews.length,
    averageRating: Number(averageRating.toFixed(2)),
    exactDuplicateNames: exactDuplicates.map(([name, items]) => ({
      name,
      professors: items.map((item) => item.professor),
    })),
    sharedFirstNames: sharedFirstNames.map(([name, items]) => ({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      professors: items.map((item) => item.professor),
      reviews: items,
    })),
    sharedLastNames: sharedLastNames.map(([name, items]) => ({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      professors: items.map((item) => item.professor),
      reviews: items,
    })),
    duplicateSubjects,
  };
}

export function formatDatasetSummaryForPrompt(summary) {
  const lines = [
    `Total professors in dataset: ${summary.totalProfessors}`,
    `Average rating: ${summary.averageRating}/5`,
    `Exact duplicate full names: ${summary.exactDuplicateNames.length}`,
    `Shared first names (possible confusion): ${summary.sharedFirstNames.length}`,
    `Shared last names (possible confusion): ${summary.sharedLastNames.length}`,
    `Subjects taught by more than one professor: ${summary.duplicateSubjects.length}`,
  ];

  if (summary.sharedFirstNames.length > 0) {
    lines.push("Shared first names:");
    for (const group of summary.sharedFirstNames) {
      lines.push(
        `- ${group.displayName}: ${group.reviews.map((r) => `${r.professor} (${r.subject})`).join(", ")}`
      );
    }
  }

  if (summary.sharedLastNames.length > 0) {
    lines.push("Shared last names:");
    for (const group of summary.sharedLastNames) {
      lines.push(
        `- ${group.displayName}: ${group.reviews.map((r) => `${r.professor} (${r.subject})`).join(", ")}`
      );
    }
  }

  if (summary.duplicateSubjects.length > 0) {
    lines.push(
      ...summary.duplicateSubjects.map(
        (group) =>
          `- ${group.displaySubject}: ${group.professors.join(", ")}`
      )
    );
  }

  return lines.join("\n");
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function isTotalCountQuery(text) {
  return matchesAny(text, [
    /\bprofessor.*\bin total\b/,
    /\bprofessor.*\bin the database\b/,
    /\bprofessor.*\bin this dataset\b/,
    /\bprofessor.*\bin the dataset\b/,
    /\btotal\b.*\bprofessor/,
    /\bsize of\b.*\bdataset\b/,
    /\bhow many\b.*\bprofessor(?:s)?\s*(?:are there|do we have|exist|in total)\b/,
    /\bhow many\b.*\bprofessor(?:s)?\s*\?/,
  ]);
}

function extractBestSubjectQuery(query) {
  const text = normalizeText(query);
  const patterns = [
    /\b(?:best|top|recommend(?:ed)?)\s+professor(?:s)?\s+(?:for|in|teaching)\s+([a-z0-9 ]{3,60})/,
    /\b(?:best|top)\s+([a-z0-9 ]{3,60})\s+professor(?:s)?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+\?*$/, "");
    }
  }

  return null;
}

function isSubjectCountQuery(text) {
  return (
    extractSubjectFilter(text) !== null &&
    matchesAny(text, [/\bhow many\b/, /\bnumber of\b/, /\bcount\b/])
  );
}

export function detectDatasetQueryIntent(query) {
  const text = normalizeText(query);

  if (
    matchesAny(text, [
      /\bsame last name/,
      /\bshared last name/,
      /\bshare.*\blast name/,
      /\blast name collision/,
    ])
  ) {
    return "shared_last_names";
  }

  if (
    matchesAny(text, [
      /\bsame first name/,
      /\bshared first name/,
      /\bshare.*\bfirst name/,
      /\bfirst name collision/,
    ])
  ) {
    return "shared_first_names";
  }

  if (
    matchesAny(text, [
      /\bsimilar name/,
      /\bidentical name/,
      /\bduplicate name/,
      /\bsame name/,
      /\bshare.*\bname/,
      /\bname collision/,
      /\bnames collide/,
    ])
  ) {
    return "duplicates";
  }

  if (extractBestSubjectQuery(query)) {
    return "best_by_subject";
  }

  if (
    matchesAny(text, [
      /\bsame subject/,
      /\bsame class/,
      /\bsame course/,
      /\bduplicate subject/,
      /\bshare.*\bsubject/,
      /\bshare.*\bclass/,
      /\bshare.*\bcourse/,
      /\bteach the same/,
      /\bidentical subject/,
      /\bidentical class/,
      /\bprofessors who teach the same/,
    ])
  ) {
    return "duplicate_subjects";
  }

  if (isSubjectCountQuery(text)) {
    return "count_by_subject";
  }

  if (isTotalCountQuery(text)) {
    return "count";
  }

  if (
    matchesAny(text, [
      /\bhow many\b.*\bprofessor/,
      /\bnumber of\b.*\bprofessor/,
      /\bcount\b.*\bprofessor/,
    ]) &&
    !matchesAny(text, [/\bclass\b/, /\bcourse\b/, /\bsubject\b/, /\bteach/])
  ) {
    return "count";
  }

  if (
    matchesAny(text, [
      /\blist all\b.*\bprofessor/,
      /\ball professor/,
      /\bevery professor/,
      /\bprofessor names\b/,
      /\bwho are the professors\b/,
    ])
  ) {
    return "list";
  }

  if (matchesAny(text, [/\bhighest rated\b/, /\bbest rated\b/, /\btop rated\b/])) {
    return "highest_rated";
  }

  if (matchesAny(text, [/\blowest rated\b/, /\bworst rated\b/, /\bpoorly rated\b/])) {
    return "lowest_rated";
  }

  if (matchesAny(text, [/\baverage rating\b/, /\bmean rating\b/])) {
    return "average_rating";
  }

  return null;
}

function formatNameGroup(label, groups) {
  if (!groups.length) return null;

  const lines = groups.map((group) => {
    const entries = group.reviews
      .map((review) => `\`${review.professor}\` (${review.subject})`)
      .join(", ");
    return `- **${group.displayName}** → ${entries}`;
  });

  return `${label}:\n${lines.join("\n")}`;
}

function formatProfessorMatches(matches, subjectLabel) {
  if (!matches.length) {
    return `I couldn't find any professors teaching **${subjectLabel}** in the dataset.`;
  }

  const lines = matches.map(
    (review) =>
      `- **${review.professor}** — ${review.subject} (${review.stars}/5)`
  );

  return lines.join("\n");
}

export function answerDatasetQueryFromReviews(query, reviews) {
  const intent = detectDatasetQueryIntent(query);
  if (!intent) return null;

  const summary = buildDatasetSummary(reviews);

  switch (intent) {
    case "count":
      return `There are **${summary.totalProfessors} professors** in the ProfessorMatch dataset (indexed from \`reviews.json\`).`;

    case "count_by_subject": {
      const subjectFilter = extractSubjectFilter(query);
      const matches = filterReviewsBySubject(reviews, subjectFilter);

      if (matches.length === 0) {
        return `There are **0 professors** teaching **${subjectFilter}** in the dataset.`;
      }

      if (matches.length === 1) {
        return `There is **1 professor** teaching **${subjectFilter}** in the dataset:\n\n${formatProfessorMatches(matches, subjectFilter)}`;
      }

      return `There are **${matches.length} professors** teaching **${subjectFilter}** in the dataset:\n\n${formatProfessorMatches(matches, subjectFilter)}`;
    }

    case "duplicate_subjects": {
      if (summary.duplicateSubjects.length === 0) {
        return "**No** — each professor teaches a unique subject title in this dataset.";
      }

      const lines = summary.duplicateSubjects.map(
        (group) =>
          `- **${group.displaySubject}** → ${group.professors.map((name) => `\`${name}\``).join(", ")}`
      );

      return [
        `**Yes** — **${summary.duplicateSubjects.length} subject(s)** are taught by more than one professor:`,
        "",
        lines.join("\n"),
      ].join("\n");
    }

    case "shared_last_names": {
      if (summary.sharedLastNames.length === 0) {
        return "**No** — no two professors share a last name in this dataset.";
      }

      const block = formatNameGroup(
        "Professors grouped by shared last name",
        summary.sharedLastNames
      );

      return [
        `**Yes** — **${summary.sharedLastNames.length} last name(s)** appear more than once:`,
        "",
        block,
      ].join("\n");
    }

    case "shared_first_names": {
      if (summary.sharedFirstNames.length === 0) {
        return "**No** — no two professors share a first name in this dataset.";
      }

      const block = formatNameGroup(
        "Professors grouped by shared first name",
        summary.sharedFirstNames
      );

      return [
        `**Yes** — **${summary.sharedFirstNames.length} first name(s)** appear more than once:`,
        "",
        block,
      ].join("\n");
    }

    case "best_by_subject": {
      const subjectFilter = extractBestSubjectQuery(query);
      const matches = filterReviewsBySubject(reviews, subjectFilter).sort(
        (a, b) => b.stars - a.stars
      );

      if (matches.length === 0) {
        return `I couldn't find professors teaching **${subjectFilter}** in the dataset.`;
      }

      const lines = matches.map(
        (review) =>
          `- **${review.professor}** — ${review.subject} (${review.stars}/5): ${review.review}`
      );

      return [
        `Here are the **${matches.length} professor(s)** for **${subjectFilter}**, ranked by rating:`,
        "",
        lines.join("\n"),
      ].join("\n");
    }

    case "duplicates": {
      if (summary.exactDuplicateNames.length > 0) {
        const groups = summary.exactDuplicateNames
          .map(
            (group) =>
              `- \`${group.professors.join("`, `")}\` share the exact same normalized name`
          )
          .join("\n");
        return `Yes — there are **${summary.exactDuplicateNames.length} exact duplicate name group(s)**:\n\n${groups}`;
      }

      const firstNameBlock = formatNameGroup(
        "Professors who share a first name",
        summary.sharedFirstNames
      );
      const lastNameBlock = formatNameGroup(
        "Professors who share a last name",
        summary.sharedLastNames
      );

      return [
        "**No** — every professor has a unique full name in the dataset.",
        "",
        "There *are* similar names that can look like collisions when searching:",
        firstNameBlock,
        lastNameBlock,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    case "list": {
      const names = reviews.map((review) => `- ${review.professor} (${review.subject})`);
      return `Here are all **${summary.totalProfessors} professors** in the dataset:\n\n${names.join("\n")}`;
    }

    case "highest_rated": {
      const topRating = Math.max(...reviews.map((review) => review.stars));
      const top = reviews.filter((review) => review.stars === topRating);
      const lines = top.map(
        (review) => `- **${review.professor}** (${review.subject}) — ${review.stars}/5`
      );
      return `The highest rating in the dataset is **${topRating}/5**, shared by:\n\n${lines.join("\n")}`;
    }

    case "lowest_rated": {
      const bottomRating = Math.min(...reviews.map((review) => review.stars));
      const bottom = reviews.filter((review) => review.stars === bottomRating);
      const lines = bottom.map(
        (review) => `- **${review.professor}** (${review.subject}) — ${review.stars}/5`
      );
      return `The lowest rating in the dataset is **${bottomRating}/5**:\n\n${lines.join("\n")}`;
    }

    case "average_rating":
      return `The average professor rating across all **${summary.totalProfessors}** records is **${summary.averageRating}/5**.`;

    default:
      return null;
  }
}

export async function answerDatasetQuery(query) {
  const reviews = await loadReviews();
  return answerDatasetQueryFromReviews(query, reviews);
}
