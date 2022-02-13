import { GetStaticProps } from 'next';
import { useState } from 'react';
import Head from 'next/head'
import { FiUser, FiCalendar } from 'react-icons/fi'
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link'
import Header from '../components/Header';

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
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)
  const [currentPage, setCurrentPage] = useState(1)

  async function handleNextPage() {
    if(currentPage !== 1 && nextPage === null)
      return
    
    const response = await fetch(`${nextPage}`).then(result => result.json())
    setNextPage(response.next_page)
    setCurrentPage(response.page)

    const newPosts = response.results.map(post => {
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

    setPosts([...posts, ...newPosts])
  }

  return(
    <>  
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      
      <main className={commonStyles.container}>  

        <Header />

        <div className={styles.post}>
          {
            posts.map(result => (
              <Link 
                key={result.uid} 
                href={`/post/${result.uid}`}
              >
                 <a>
                  <h1>{result.data.title}</h1>
                  <p>{result.data.subtitle}</p>
                  <div className={commonStyles.info}>
                    <div>
                      <FiCalendar />
                      <time>{
                          format(new Date(result.first_publication_date),
                                "PP",
                              {
                                locale: ptBR,
                              }
                            )
                          }
                    </time>
                    </div>

                    <div>
                      <FiUser />
                      <span>{result.data.author}</span>
                    </div>
                  </div>
                </a>
              </Link>
            ))
          }
        </div>
        
        {
          nextPage ?
            <div 
            className={styles.buttonLoadMorePosts}
            onClick={handleNextPage}
            >
              Carregar mais posts
            </div>
          : <></>
        }



          {preview && 
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.preview}>
                  Sair do modo preview
                </a>
              </Link>
            </aside>
          }
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
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
        pageSize: 1,
    }
  );


  const results = postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
    }
  })

  const postsPagination = {
    results,
    next_page: postsResponse.next_page
  }

  return {
      props: {
        postsPagination,
        preview
      },
      revalidate: 60 * 60 * 24 //24 hrs
  }

};
