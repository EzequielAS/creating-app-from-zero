import Link from 'next/link'

import styles from './header.module.scss'

export default function Header() {
    return(
      <div className={styles.headerSyle}>
          <Link href='/'>
            <a>
              <img 
                src="/Logo.svg" 
                alt="logo"
              />
            </a>
          </Link>
      </div>
    
    )
}
