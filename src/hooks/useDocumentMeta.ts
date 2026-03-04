import { useEffect } from 'react';

const SITE_NAME = 'Heartopia Recipe Calculator';
const DEFAULT_DESCRIPTION =
  'Optimize your Heartopia cooking profits with our recipe calculator. Browse 65+ recipes, compare profit margins at every star rating, plan batch cooking sessions, and track ingredients.';

interface DocumentMeta {
  title?: string;
  description?: string;
}

export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Cooking Profit Guide & Planner`;
    document.title = fullTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description ?? DEFAULT_DESCRIPTION);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description ?? DEFAULT_DESCRIPTION);
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', fullTitle);
    }

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
      twitterDesc.setAttribute('content', description ?? DEFAULT_DESCRIPTION);
    }
  }, [title, description]);
}
