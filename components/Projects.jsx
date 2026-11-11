"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useFilter } from "@/context/FilterContext";

function getRepoTags(repo) {
  const tags = [];
  if (repo.language) tags.push(repo.language);
  if (repo.topics && repo.topics.length > 0) {
    tags.push(...repo.topics);
  }
  let uniqueTags = [...new Set(tags)];
  if (uniqueTags.length === 0) {
    uniqueTags = ["Software", "Project", "Code"];
  } else if (uniqueTags.length === 1) {
    uniqueTags.push(repo.name.length > 5 ? "Development" : "Web");
    uniqueTags.push("Code");
  } else if (uniqueTags.length === 2) {
    uniqueTags.push("Code");
  }
  return uniqueTags.slice(0, 3);
}

const topicImages = {
  "react": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop",
  "node": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop",
  "javascript": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop",
  "python": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
  "html": "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=600&auto=format&fit=crop",
  "css": "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=600&auto=format&fit=crop",
  "java": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
  "php": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=600&auto=format&fit=crop",
  "go": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=600&auto=format&fit=crop",
  "c++": "https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=600&auto=format&fit=crop",
  "typescript": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop",
  "sql": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600&auto=format&fit=crop",
  "database": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600&auto=format&fit=crop",
  "docker": "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=600&auto=format&fit=crop",
  "linux": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=600&auto=format&fit=crop",
  "mobile": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop",
  "web": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop",
  "design": "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop",
  "api": "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop",
  "ai": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=600&auto=format&fit=crop",
  "game": "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop",
  "cloud": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600&auto=format&fit=crop",
  "security": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
  "e-commerce": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600&auto=format&fit=crop",
  "ecommerce": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600&auto=format&fit=crop",
  "loja": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=600&auto=format&fit=crop",
  "default1": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop",
  "default2": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=600&auto=format&fit=crop",
  "default3": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop",
  "default4": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
};

function getRepoImage(repo) {
  const tags = getRepoTags(repo).map(t => t.toLowerCase());
  
  // Try to find a matching tag in topicImages
  for (const tag of tags) {
    if (topicImages[tag]) return topicImages[tag];
  }
  
  // Try to match part of the repo name
  const name = repo.name.toLowerCase();
  for (const key in topicImages) {
    if (name.includes(key)) return topicImages[key];
  }
  
  // Fallback to random default based on repo id
  const defaults = [topicImages.default1, topicImages.default2, topicImages.default3, topicImages.default4];
  const index = (repo.id || 0) % defaults.length;
  return defaults[index];
}

export default function Projects() {
  const { t, language } = useLanguage();
  const { selectedSkill, setSelectedSkill } = useFilter();
  const [allRepos, setAllRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const isHovered = useRef(false);
  const startX = useRef(0);
  const scrollDirection = useRef(1); // 1 = Esquerda, -1 = Direita

  const allAvailableTags = useMemo(() => {
    const tags = new Set();
    allRepos.forEach(repo => {
      getRepoTags(repo).forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allRepos]);

  const repos = useMemo(() => {
    if (!allRepos.length) return [];
    if (selectedSkill) {
      return allRepos.filter(repo => {
        const tags = getRepoTags(repo);
        return tags.some(tag => tag.toLowerCase() === selectedSkill.toLowerCase());
      });
    }
    const initial = allRepos.slice(0, 6);
    return [...initial, ...initial, ...initial];
  }, [selectedSkill, allRepos]);

  useEffect(() => {
    fetch("https://api.github.com/users/Lukinocencio/repos?type=public&sort=updated&per_page=30")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filteredRepos = data.filter(repo => repo.name !== "Lukinocencio");
          setAllRepos(filteredRepos);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar projetos", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!allRepos.length || !scrollRef.current) return;
    
    if (selectedSkill) {
      scrollRef.current.scrollLeft = 0;
    } else {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 3;
        }
      }, 100);
    }
  }, [selectedSkill, allRepos.length]);

  useEffect(() => {
    if (loading || !scrollRef.current) return;

    let animationId;
    const loop = () => {
      const el = scrollRef.current;
      if (!el) return;

      // Gira apenas se NAO tiver skill selecionada, NAO tiver mouse em cima, e NAO estiver arrastando
      if (!selectedSkill && !isDragging.current && !isHovered.current) {
        let newScrollLeft = el.scrollLeft + (1 * scrollDirection.current);
        const singleBlockWidth = el.scrollWidth / 3;

        if (newScrollLeft >= singleBlockWidth * 2) {
          newScrollLeft -= singleBlockWidth;
        } else if (newScrollLeft <= 0) {
          newScrollLeft += singleBlockWidth;
        }
        
        el.scrollLeft = newScrollLeft;
      }

      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [loading, selectedSkill]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX;
    if (scrollRef.current) scrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    isHovered.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    
    const x = e.pageX;
    const delta = startX.current - x; 
    
    if (delta !== 0) {
      let newScrollLeft = scrollRef.current.scrollLeft + delta;
      
      // Somente faz o loop infinito se nao houver filtro ativo
      if (!selectedSkill) {
        const singleBlockWidth = scrollRef.current.scrollWidth / 3;
        if (newScrollLeft >= singleBlockWidth * 2) {
          newScrollLeft -= singleBlockWidth;
        } else if (newScrollLeft <= 0) {
          newScrollLeft += singleBlockWidth;
        }
      }
      
      scrollRef.current.scrollLeft = newScrollLeft;
      scrollDirection.current = delta > 0 ? 1 : -1;
      startX.current = x; 
    }
  };

  const handleMouseEnter = () => {
    isHovered.current = true;
  };

  const preventImageDrag = (e) => e.preventDefault();

  return (
    <section id="projects" className="projects">
      <div className="projects__content max-width">
        <h2 className="secondary-title">{t.projects_title}</h2>
        <p>{t.projects_desc}</p>

        {allAvailableTags.length > 0 && (
          <div className="projects__filter-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '30px', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedSkill(null)}
              style={{
                padding: '6px 14px', fontSize: '1.2rem', borderRadius: '20px', cursor: 'pointer',
                background: !selectedSkill ? 'var(--primary-color)' : 'transparent',
                color: !selectedSkill ? '#fff' : 'var(--text-color)',
                border: !selectedSkill ? '2px solid var(--primary-color)' : '2px solid var(--text-color)',
                transition: 'all 0.3s ease', fontWeight: 'bold'
              }}
              aria-label={language === "pt" ? "Mostrar todos os projetos" : "Show all projects"}
            >
              {language === "pt" ? "Todos" : "All"}
            </button>
            {allAvailableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedSkill(selectedSkill === tag ? null : tag)}
                style={{
                  padding: '6px 14px', fontSize: '1.2rem', borderRadius: '20px', cursor: 'pointer',
                  background: selectedSkill === tag ? 'var(--primary-color)' : 'transparent',
                  color: selectedSkill === tag ? '#fff' : 'var(--text-color)',
                  border: selectedSkill === tag ? '2px solid var(--primary-color)' : '2px solid var(--text-color)',
                  transition: 'all 0.3s ease', fontWeight: 'bold'
                }}
                aria-label={`Filtrar por ${tag}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className="projects-marquee-container"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
      >
        <ul key={selectedSkill || 'all'} className={`projects-marquee-content ${selectedSkill ? "filtered-view" : ""}`}>
          {loading ? (
            <p style={{ textAlign: "center", width: "100%", fontSize: "1.6rem" }}>Carregando projetos...</p>
          ) : selectedSkill && repos.length === 0 ? (
            <div style={{ textAlign: "center", width: "100%", padding: "40px 0" }}>
              <p style={{ fontSize: "1.8rem", color: "var(--primary-color, #ff6b6b)", marginBottom: "10px" }}>Oops!</p>
              <p style={{ fontSize: "1.4rem" }}>Nenhum projeto público ainda disponível com a skill <strong>{selectedSkill}</strong>.</p>
            </div>
          ) : (
            repos.map((repo, index) => (
              <li key={`${repo.id}-${index}`} className={selectedSkill ? "highlighted-project" : ""}>
                <div className="image">
                  <img src={getRepoImage(repo)} alt={repo.name} onDragStart={preventImageDrag} />
                </div>
                <div className="projects__info">
                  <h3 className="tertiary-title">{repo.name}</h3>
                  <p>{repo.description || "Sem descrição disponível."}</p>
                  <div className="projects__tags">
                    {getRepoTags(repo).map((tag, i) => (
                      <span key={i} className="tech-badge" style={{ animationDelay: `${i * 0.15}s` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a href={repo.html_url} target="_blank" rel="noreferrer" draggable="false">
                    {t.projects_read_more}
                  </a>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
