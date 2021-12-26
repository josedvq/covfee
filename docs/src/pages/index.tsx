import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import Logo from '../../static/img/logo.svg'

const features = [
  {
    title: 'Annotate affect, actions and keypoints',
    imageUrl: 'img/keypoints.png',
    description: (
      <>
        Use covfee's continuous annotation techniques  for affect (Ranktrace, Gtrace) action localization (via keyboard press) and keyboard (via mouse cursor with automatic speed adjustment). 
      </>
    ),
  },
  {
    title: 'Script your annotation flow',
    imageUrl: 'img/spec.png',
    description: (
      <>
        Use your favorite programming language to generate a covfee specification file, containing the details of your HITs, no matter how complex.
      </>
    ),
  },
  {
    title: 'Qualification tasks and consent forms',
    imageUrl: 'img/consent.png',
    description: (
      <>
        Add consent forms and qualification tasks to your HITs.
      </>
    ),
  },
  {
    title: 'Made for crowd-sourcing',
    imageUrl: 'img/admin.png',
    description: (
      <>
        Easily get batch URLs from Covfee's admin panel, track and download annotations in bulk.
      </>
    ),
  },
  {
    title: 'Modern and extensible',
    imageUrl: 'img/lifecycle.png',
    description: (
      <>
        Implement your annotation techniques by subclassing a Typescript class and using Covfee's helper classes, with only a basic knowledge of Javascript.
      </>
    ),
  }
];

const authors = [
  {
    title: 'Jose Vargas Quiros',
    imageUrl: 'https://www.gravatar.com/avatar/3220d6c4eeb0c3a64f2c727306997aca?s=200',
    description: (
      <>
        Jose is on a mission to reduce the time and effort necessary to obtain high-quality human behavior annotations and datasets.
      </>
    ),
  }
];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx(styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Author({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx(styles.author)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.authorImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <Logo className={styles.logo}/>
          <h1 className={clsx("hero__title", styles.title)} ><span style={{color: 'white'}}>covfee:</span> continuous video feedback tool</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/')}>
              Get Started
            </Link>
            <iframe src="https://ghbtns.com/github-btn.html?user=josedvq&repo=covfee&type=watch&count=true&size=large" frameborder="0" scrolling="0" width="170" height="30" title="GitHub"></iframe>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <div class="container">
            <section className={styles.features}>
                  {features.map((props, idx) => (
                    <Feature key={idx} {...props} />
                  ))}
            </section>
          </div>
        )}
        {authors && authors.length > 0 && (
          <section className={styles.authors}>
                {authors.map((props, idx) => (
                  <Author key={idx} {...props} />
                ))}
          </section>
        )}
      </main>
    </Layout>
  );
}
