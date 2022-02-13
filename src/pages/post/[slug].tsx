import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import { getPrismicClient } from '../../services/prismic'
import Header from '../../components/Header'
import Comments from '../../components/Comments'
import { RichText } from "prismic-dom"
import { format } from 'date-fns'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import ptBR from 'date-fns/locale/pt-BR'
import Prismic from '@prismicio/client'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss'

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      }
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      }
    }[];
  }
}

export default function Post({ post, preview, navigation }: PostProps) {
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

  const isPostEdited = post.first_publication_date !== post.last_publication_date

  let editionDate: string

  if (isPostEdited) {
    editionDate = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    );
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

              <p className={styles.isPostEdited}>{isPostEdited && editionDate}</p>
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

          <section className={`${styles.navigation}`}>
            {navigation?.prevPost.length > 0 && (
              <div>
                <h3>{navigation.prevPost[0].data.title}</h3>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}

            {navigation?.nextPost.length > 0 && (
              <div>
                <h3>{navigation.nextPost[0].data.title}</h3>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            )}
          </section>

          <Comments />
          
          {preview && 
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.preview}>
                  Sair do modo preview
                </a>
              </Link>
            </aside>
          }

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


export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const { slug } = params
  
  const prismic = getPrismicClient()

  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref || null
  })

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.fist_publication_date]'
    }
  )

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]'
    }
  )
  

  const post = {
      uid: response.uid,
      first_publication_date: response.first_publication_date,
      last_publication_date: response.last_publication_date,
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
          post,
          preview,
          navigation: {
            prevPost: prevPost?.results,
            nextPost: nextPost?.results
          }
      },
      revalidate: 60 * 30, //30 minutes
  }
}
