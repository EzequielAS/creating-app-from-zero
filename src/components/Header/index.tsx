import styles from './header.module.scss'

export default function Header() {
    return(
      <div 
        className={styles.headerSyle}
      >
        <img 
          src="/Logo.svg" 
          alt="logo"
        />
      </div>
    )
}
