document.addEventListener('DOMContentLoaded', () => {
    // 1. User setup
    const userStr = localStorage.getItem('user');
    if (!userStr) return; // Handled by inline script in HTML
    const user = JSON.parse(userStr);

    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-initials').textContent = user.initials;
    document.getElementById('greeting').textContent = `Good morning, ${user.name.split(' ')[1] || user.name.split(' ')[0]}`;
    
    // Stats
    document.getElementById('stat-papers').textContent = user.stats.papersPublished;
    document.getElementById('stat-citations').textContent = user.stats.citations.toLocaleString();
    document.getElementById('stat-collab').textContent = user.stats.collaborators;
    document.getElementById('stat-datasets').textContent = user.stats.datasetsShared;

    // 2. Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');
            
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update active view
            views.forEach(v => {
                if (v.id === `view-${targetView}`) {
                    v.classList.add('active-view');
                } else {
                    v.classList.remove('active-view');
                }
            });
        });
    });

    // 3. Fetch Papers
    const papersContainer = document.getElementById('papers-list');

    const renderPapers = (papers) => {
        papersContainer.innerHTML = '';
        papers.forEach(paper => {
            const card = document.createElement('div');
            card.className = 'paper-row-card';
            card.innerHTML = `
                <div class="status-badge">Published</div>
                <h3 class="paper-title">${paper.title}</h3>
                <div class="paper-meta">
                    ${paper.authors.join(', ')} · ${paper.domain} · ${new Date(paper.date).getFullYear()}
                </div>
            `;
            papersContainer.appendChild(card);
        });
    };

    fetch('/api/papers')
        .then(res => res.json())
        .then(papers => {
            renderPapers(papers);
            
            // Setup filters
            const filterTabs = document.querySelectorAll('.filter-tab');
            filterTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    filterTabs.forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    const filter = e.target.textContent;
                    if (filter === 'All') {
                        renderPapers(papers);
                    } else if (filter === 'Mine') {
                        renderPapers(papers.filter(p => p.authors.includes(user.name)));
                    } else if (filter === 'Shared') {
                        renderPapers(papers.filter(p => !p.authors.includes(user.name)));
                    }
                });
            });

            // Open Editor modal when clicking a paper
            document.querySelectorAll('.paper-row-card').forEach(card => {
                card.addEventListener('click', () => {
                    openModal('editor-modal');
                });
            });
        })
        .catch(err => {
            console.error('Error fetching papers', err);
            papersContainer.innerHTML = '<p>Error loading papers.</p>';
        });

    // Create Paper Logic
    const btnSubmitPaper = document.getElementById('btn-submit-paper');
    if (btnSubmitPaper) {
        btnSubmitPaper.addEventListener('click', () => {
            const title = document.getElementById('new-paper-title').value;
            const domain = document.getElementById('new-paper-domain').value;
            const authorsStr = document.getElementById('new-paper-authors').value;

            if (!title || !domain || !authorsStr) {
                alert("Please fill in all fields");
                return;
            }

            const authors = authorsStr.split(',').map(a => a.trim());

            fetch('/api/papers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, domain, authors })
            })
            .then(res => res.json())
            .then(newPaper => {
                alert("Paper created successfully!");
                closeModal('create-paper-modal');
                // Refresh the page to show the new paper (since state is tricky)
                window.location.reload();
            })
            .catch(err => console.error("Error creating paper:", err));
        });
    }

    // 4. Fetch Datasets
    const datasetsContainer = document.getElementById('datasets-grid');
    if (datasetsContainer) {
        fetch('/api/datasets')
            .then(res => res.json())
            .then(datasets => {
                datasetsContainer.innerHTML = '';
                datasets.forEach(ds => {
                    const schemaHtml = ds.schema.map(s => `${s.field}: <span style="color:var(--accent-blue)">${s.type}</span>`).join('<br>');
                    const card = document.createElement('div');
                    card.className = 'dataset-card';
                    card.innerHTML = `
                        <div class="ds-icon">🗄️</div>
                        <div class="ds-title">${ds.title}</div>
                        <div class="ds-uploader">by ${ds.uploader}</div>
                        <div class="ds-meta">
                            <span>💾 ${ds.size}</span>
                            <span>📄 ${ds.format}</span>
                            <span>⬇️ ${ds.downloads}</span>
                        </div>
                        <div class="ds-schema-preview">${schemaHtml}</div>
                        <button class="btn-outline" onclick="openModal('preview-modal')">Preview Data</button>
                    `;
                    datasetsContainer.appendChild(card);
                });
            });
    }

    // 5. Fetch Versions (GitHub-like)
    const commitContainer = document.getElementById('commit-history');
    const diffContent = document.getElementById('diff-content');
    const diffTitle = document.getElementById('diff-title');

    if (commitContainer) {
        fetch('/api/versions')
            .then(res => res.json())
            .then(versions => {
                commitContainer.innerHTML = '';
                versions.forEach(v => {
                    const item = document.createElement('div');
                    item.className = 'commit-item';
                    item.innerHTML = `
                        <div class="commit-hash">${v.commitHash}</div>
                        <div class="commit-msg">${v.message}</div>
                        <div class="commit-meta">${v.author} · ${new Date(v.date).toLocaleDateString()}</div>
                    `;
                    item.addEventListener('click', () => {
                        document.querySelectorAll('.commit-item').forEach(c => c.classList.remove('active'));
                        item.classList.add('active');
                        diffTitle.textContent = `Commit: ${v.commitHash} by ${v.author}`;
                        
                        const diffLines = v.diff.split('\n').map(line => {
                            if (line.startsWith('+')) return `<span class="diff-add">${line}</span>`;
                            if (line.startsWith('-')) return `<span class="diff-sub">${line}</span>`;
                            return line;
                        }).join('<br>');
                        
                        diffContent.innerHTML = diffLines;
                    });
                    commitContainer.appendChild(item);
                });
            });
    }

    // 6. Fetch Peer Reviews
    const reviewsContainer = document.getElementById('reviews-list');
    if (reviewsContainer) {
        fetch('/api/reviews')
            .then(res => res.json())
            .then(reviews => {
                reviewsContainer.innerHTML = '';
                reviews.forEach(r => {
                    const statusClass = r.status.toLowerCase() === 'accepted' ? 'status-accepted' : 'status-pending';
                    const card = document.createElement('div');
                    card.className = 'review-card';
                    card.innerHTML = `
                        <div class="review-card-left">
                            <h3>${r.paperTitle}</h3>
                            <p>Reviewed by ${r.reviewer} · ${r.date}</p>
                            <div class="review-comment">"${r.comments}"</div>
                        </div>
                        <div class="review-status ${statusClass}">${r.status}</div>
                    `;
                    reviewsContainer.appendChild(card);
                });
            });
    }
});
