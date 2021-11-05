import { GetStaticProps } from 'next';
import Head from 'next/head'
import { FiUser, FiCalendar } from 'react-icons/fi'
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  return(
    <>  
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      
      <main className={styles.container}>  

        <header className={styles.header}>
          <img src="Logo.svg" alt="logo"/>
        </header>

        <div className={styles.posts}>
          {
            postsPagination.results.map(result => (
              <a key={result.uid} href=''>
                <h1>{result.data.title}</h1>
                <p>{result.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FiCalendar />
                    <time>{result.first_publication_date}</time>
                  </div>

                  <div>
                    <FiUser />
                    <span>{result.data.author}</span>
                  </div>
                </div>
              </a>
            ))
          }
        </div>

      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
      Prismic.predicates.at('document.type', 'post')
    ], {
        fetch: [
          'post.title', 
          'post.content', 
          'post.author', 
          'post.subtitle'
        ],
        pageSize: 5,
    }
  );


  const results = postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date,),
           "PP",
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
    }
  })

  return {
      props: {
        postsPagination: {
          results,
          next_page: null
        }
      },
      revalidate: 60 * 60 * 24 //24 hrs
  }

};
