import { useEffect } from 'react';

const defaultTitle = 'Construction Operations Portal';
const defaultDescription = 'Construction operations, project visibility, and field-ready delivery support for industrial, commercial, renovation, and residential work.';

const getOrCreateMetaTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }

  return tag;
};

export const usePageMeta = ({ title, description }) => {
  useEffect(() => {
    const nextTitle = title || defaultTitle;
    const nextDescription = description || defaultDescription;

    document.title = nextTitle;

    const descriptionTag = getOrCreateMetaTag('meta[name="description"]', { name: 'description' });
    const ogTitleTag = getOrCreateMetaTag('meta[property="og:title"]', { property: 'og:title' });
    const ogDescriptionTag = getOrCreateMetaTag('meta[property="og:description"]', { property: 'og:description' });
    const twitterTitleTag = getOrCreateMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' });
    const twitterDescriptionTag = getOrCreateMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' });

    descriptionTag.setAttribute('content', nextDescription);
    ogTitleTag.setAttribute('content', nextTitle);
    ogDescriptionTag.setAttribute('content', nextDescription);
    twitterTitleTag.setAttribute('content', nextTitle);
    twitterDescriptionTag.setAttribute('content', nextDescription);
  }, [title, description]);
};

export const pageMetaDefaults = {
  title: defaultTitle,
  description: defaultDescription,
};
