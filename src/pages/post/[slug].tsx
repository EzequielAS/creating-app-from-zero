import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';
import Head from 'next/head'
import { RichText } from "prismic-dom"
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import { useRouter } from 'next/router';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length

    const words = contentItem.body.map(item => item.text.split(' ').length)
    words.map(word => (total += word))

    return total
  }, 0)
  const readTime = Math.ceil(totalWords/200)

  const router = useRouter()

  if(router.isFallback){
    return <h1>Carregando...</h1>
  }

  return(
    <>
      <Head>
        <title>{post.data.title} | teste</title>
        <link
          rel="shortcut icon" 
          href="/Logo.svg" 
          type="image/x-icon" 
        />
      </Head>

      <Header />

      <div className={styles.containerImg}>
        <img src={post.data.banner.url} alt={post.data.title}/>
      </div>

      <div className={commonStyles.container}>

          <div className={styles.post}>

            <div className={styles.mainPostInfo}>
              <h1>{post.data.title}</h1>
              <div className={commonStyles.info}>
                  <div>
                    <FiCalendar />
                    <time>{format(
                      new Date(post.first_publication_date,),
                      "PP",
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  </div>

                  <div>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>

                  <div>
                    <FiClock />
                    <span>{readTime} min</span>
                  </div>
              </div>
            </div>
            
            {post.data.content.map((ctt, index) => (
              <article 
                key={index} 
                className={styles.paragraph}
              >
                <h2>{ctt.heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{__html: RichText.asHtml(ctt.body)}}
                />
              </article>
            ))}

          </div>

      </div>

    </>
  )
}


export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient()
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ])

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid } 
    }
  })

  return {
      paths,
      fallback: true
  }
}


export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params
  
  const prismic = getPrismicClient()

  const response = await prismic.getByUID('post', String(slug), {})
  
  const post = {
      uid: response.uid,
      first_publication_date: response.first_publication_date,
      data: {
        title: response.data.title,
        subtitle: response.data.subtitle,
        banner: {
          url: response.data.banner.url
        },
        author: response.data.author,
        content: response.data.content.map(content => (
          {
            heading: content.heading, 
            body: [...content.body]
          }
        ))
      }
  }
  
  return {
      props: {
          post
      },
      revalidate: 60 * 30, //30 minutes
  }
}
