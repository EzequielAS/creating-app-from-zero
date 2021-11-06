import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';
import Head from 'next/head'
import { RichText } from "prismic-dom"
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  slug: string;
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
      };
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
    return(
      <>
        <Head>
          <title>{post.slug} | teste</title>
          <link
            rel="shortcut icon" 
            href="/Logo.svg" 
            type="image/x-icon" 
          />
        </Head>

        <Header />

        <div className={styles.containerImg}>
          <img src={post.data.banner.url} alt={post.slug}/>
        </div>

        <div className={commonStyles.container}>

            <div className={styles.post}>

              <div className={styles.mainPostInfo}>
                <h1>{post.data.title}</h1>
                <div className={commonStyles.info}>
                    <div>
                      <FiCalendar />
                      <time>{post.first_publication_date}</time>
                    </div>

                    <div>
                      <FiUser />
                      <span>{post.data.author}</span>
                    </div>

                    <div>
                      <FiClock />
                      <span>4 min</span>
                    </div>
                </div>
              </div>
              
              {post.data.content.map((ctt, index) => (
                <article 
                  key={index} 
                  className={styles.paragraph}
                >
                  <h2>{ctt.heading}</h2>
                  <p>{ctt.body.text}</p>
                </article>
              ))}

            </div>

        </div>

      </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
      paths: [
          // { params: { slug: 'nomeSlug' } }  quais páginas serão carregadas no build da aplicação
      ],
      fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params
  
  const prismic = getPrismicClient()

  const response = await prismic.getByUID('post', String(slug), {})
  
  const post = {
      slug,
      first_publication_date: format(
        new Date(response.first_publication_date,),
         "PP",
        {
          locale: ptBR,
        }
      ),
      data: {
        title: response.data.title,
        banner: {
          url: response.data.banner.url
        },
        author: response.data.author,
        content: response.data.content.map(content => (
          {heading: content.heading, body: {text: RichText.asText(content.body)}}
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
