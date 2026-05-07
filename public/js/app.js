document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Socket.io
    const socket = io();

    // 0.5 Override fetch for JWT Auth
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
        if (url.startsWith('/api/')) {
            const token = localStorage.getItem('token');
            if (token) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
        }
        return originalFetch(url, options);
    };

    // 1. User setup
    const userStr = localStorage.getItem('user');
    if (!userStr) return; // Handled by inline script in HTML
    const user = JSON.parse(userStr);

    // Setup global review update function
    window.updateReviewStatus = async (id, status, btnElement) => {
        try {
            const res = await fetch(`/api/reviews/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                const card = btnElement.closest('.review-card');
                const statusBadge = card.querySelector('.review-status');
                statusBadge.className = `review-status status-${status.toLowerCase()}`;
                statusBadge.textContent = status;
                btnElement.parentElement.style.display = 'none';
            }
        } catch (err) { console.error(err); }
    };

    // 1. Setup User Profile (Phase 10: Academic Reputation System)
    const impactPoints = (user.stats.citations * 10) + (user.stats.papersPublished * 50);
    const badgesHtml = `<span style="font-size: 12px; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);">🏆 Top Reviewer</span>`;
    
    document.getElementById('user-name').innerHTML = `${user.name} ${badgesHtml} <span style="font-size: 13px; color: var(--accent-blue); margin-left: 8px; font-weight: 500;">⭐ ${impactPoints.toLocaleString()} Impact</span>`;
    document.getElementById('user-initials').textContent = user.initials;
    document.getElementById('greeting').textContent = `Good morning, ${user.name.split(' ')[1] || user.name.split(' ')[0]}`;

    if (user.role === 'admin') {
        const navAdmin = document.getElementById('nav-admin');
        if (navAdmin) navAdmin.style.display = 'flex';
    }
    
    // Stats
    document.getElementById('stat-papers').textContent = user.stats.papersPublished;
    document.getElementById('stat-citations').textContent = user.stats.citations.toLocaleString();
    document.getElementById('stat-collab').textContent = user.stats.collaborators;
    document.getElementById('stat-datasets').textContent = user.stats.datasetsShared;

    // 2. Hash-based Routing Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    const handleRouting = () => {
        let hash = window.location.hash || '#dashboard';
        
        // Phase 4 dynamic routing
        if (hash.startsWith('#paper/')) {
            const paperId = hash.split('/')[1];
            navItems.forEach(n => n.classList.remove('active'));
            
            // Apply fade animation logic to the detail view
            views.forEach(v => {
                if (v.id === 'view-paper-detail') {
                    v.classList.add('active-view');
                    v.style.opacity = '0';
                    setTimeout(() => {
                        v.style.transition = 'opacity 0.3s ease-in-out';
                        v.style.opacity = '1';
                    }, 10);
                } else {
                    v.classList.remove('active-view');
                    v.style.opacity = '0';
                }
            });
            
            // Fetch and display paper details
            fetch('/api/papers')
                .then(res => res.json())
                .then(papers => {
                    const paper = papers.find(p => p.id === paperId || p._id === paperId);
                    if (paper) {
                        document.getElementById('detail-title').textContent = paper.title;
                        document.getElementById('detail-meta').textContent = `By ${paper.authors.join(', ')} • ${paper.citations || 0} Citations`;
                        document.getElementById('detail-abstract').textContent = "This is a detailed abstract generated dynamically. " + paper.title + " explores groundbreaking methodologies...";
                        
                        const dlContainer = document.getElementById('paper-download-container');
                        if (dlContainer) {
                            if (paper.filePath) {
                                dlContainer.innerHTML = `<a href="${paper.filePath}" download class="btn-outline" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-size: 13px;">📥 Download Original File</a>`;
                            } else {
                                dlContainer.innerHTML = '';
                            }
                        }
                    }
                });
            return;
        }

        // Phase 8: Interactive Dataset Visualizer Routing
        if (hash.startsWith('#dataset/')) {
            const dsId = hash.split('/')[1];
            navItems.forEach(n => n.classList.remove('active'));
            
            views.forEach(v => {
                if (v.id === 'view-dataset-detail') {
                    v.classList.add('active-view');
                    v.style.opacity = '0';
                    setTimeout(() => {
                        v.style.transition = 'opacity 0.3s ease-in-out';
                        v.style.opacity = '1';
                    }, 10);
                } else {
                    v.classList.remove('active-view');
                    v.style.opacity = '0';
                }
            });
            
            // Render Chart
            setTimeout(() => {
                const ctx = document.getElementById('datasetChart').getContext('2d');
                if (window.datasetChartInstance) {
                    window.datasetChartInstance.destroy();
                }
                
                // Mock dynamic data based on ID
                const dataVals = [Math.floor(Math.random()*20), Math.floor(Math.random()*20), Math.floor(Math.random()*20), Math.floor(Math.random()*20), Math.floor(Math.random()*20)];
                const labels = ['Sample A', 'Sample B', 'Sample C', 'Sample D', 'Sample E'];
                
                const rawData = labels.map((label, index) => ({
                    sampleName: label,
                    metricValue: dataVals[index],
                    timestamp: new Date().toISOString()
                }));
                const rawContainer = document.getElementById('raw-data-content');
                if (rawContainer) {
                    rawContainer.textContent = JSON.stringify(rawData, null, 2);
                }
                
                window.datasetChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Distribution Metric',
                            data: dataVals,
                            backgroundColor: 'rgba(161, 27, 53, 0.6)', // Crimson Theme
                            borderColor: 'rgba(161, 27, 53, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: { responsive: true }
                });
                document.getElementById('ds-title').textContent = "Interactive Preview: " + dsId.replace(/-/g, ' ').toUpperCase();
                document.getElementById('ds-meta').textContent = "Auto-generated visualization from CSV data structure.";
            }, 300);
            return;
        }

        const targetView = hash.substring(1);
        
        // Update active nav
        navItems.forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[href="${hash}"]`);
        if (activeNav) activeNav.classList.add('active');

        if (targetView === 'admin' && user.role !== 'admin') {
            window.location.hash = '#dashboard';
            return;
        }

        if (targetView === 'admin') {
            if (window.fetchAdminUsers) window.fetchAdminUsers();
        }

        // Update active view with fade animation
        views.forEach(v => {
            if (v.id === `view-${targetView}`) {
                v.classList.add('active-view');
                v.style.opacity = '0';
                setTimeout(() => {
                    v.style.transition = 'opacity 0.3s ease-in-out';
                    v.style.opacity = '1';
                }, 10);
            } else {
                v.classList.remove('active-view');
                v.style.opacity = '0';
            }
        });
    };

    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // trigger on load

    // 3. Fetch Papers
    const papersContainer = document.getElementById('papers-list');

    window.renderPapers = (papers) => {
        papersContainer.innerHTML = '';
        papers.forEach(paper => {
            const card = document.createElement('div');
            card.className = 'paper-row-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="status-badge">Published</div>
                <h3 class="paper-title">${paper.title}</h3>
                <div class="paper-meta">
                    ${paper.authors.join(', ')} · ${paper.domain} · ${new Date(paper.date).getFullYear()}
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.hash = '#paper/' + (paper.id || paper._id);
            });
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

            const fileInput = document.getElementById('new-paper-file');
            
            const formData = new FormData();
            formData.append('title', title);
            formData.append('domain', domain);
            formData.append('authors', authorsStr);
            if (fileInput && fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }

            fetch('/api/papers', {
                method: 'POST',
                body: formData
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
    const fetchDatasets = () => {
        if (!datasetsContainer) return;
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
                        <button class="btn-outline" onclick="window.location.hash='#dataset/' + '${ds.id || ds.title.replace(/\s+/g, '-').toLowerCase()}'">Interactive Preview</button>
                    `;
                    datasetsContainer.appendChild(card);
                });
            });
    };
    fetchDatasets();

    // 5. Fetch Versions (GitHub-like)
    const commitContainer = document.getElementById('commit-history');
    const diffContent = document.getElementById('diff-content');
    const diffTitle = document.getElementById('diff-title');

    const paperSelect = document.getElementById('version-paper-select');
    if (paperSelect) {
        window.fetch('/api/papers')
            .then(res => res.json())
            .then(papers => {
                paperSelect.innerHTML = '<option value="all">All Papers</option>';
                papers.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id || p._id || p.title;
                    opt.textContent = p.title;
                    paperSelect.appendChild(opt);
                });
            });
            
        paperSelect.addEventListener('change', () => fetchVersions(paperSelect.value));
    }

    const fetchVersions = (filterPaperId = 'all') => {
        if (!commitContainer) return;
        window.fetch('/api/versions')
            .then(res => res.json())
            .then(versions => {
                commitContainer.innerHTML = '';
                diffContent.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 40px;">No commit selected</div>';
                diffTitle.textContent = 'Select a commit to view changes';
                
                const filteredVersions = filterPaperId === 'all' ? versions : versions.filter(v => (v.paperId === filterPaperId) || (v.paperTitle === filterPaperId));
                
                if (filteredVersions.length === 0) {
                    commitContainer.innerHTML = '<div style="padding: 20px; color: var(--text-secondary);">No commits found.</div>';
                    return;
                }
                
                filteredVersions.forEach(v => {
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
                        
                        // Phase 9: "Git for Papers" exact diff styling
                        const diffLines = (v.diff || '').split('\n').map(line => {
                            if (line.trim().startsWith('+')) return `<div style="background-color: #dcfce7; color: #166534; padding: 6px 12px; font-family: monospace; border-left: 4px solid #22c55e;">${line}</div>`;
                            if (line.trim().startsWith('-')) return `<div style="background-color: #fee2e2; color: #991b1b; padding: 6px 12px; font-family: monospace; border-left: 4px solid #ef4444; text-decoration: line-through;">${line}</div>`;
                            return `<div style="padding: 6px 12px; font-family: monospace; color: #4b5563;">${line}</div>`;
                        }).join('');
                        
                        diffContent.innerHTML = diffLines;
                    });
                    commitContainer.appendChild(item);
                });
            });
    };
    fetchVersions();

    // 6. Fetch Peer Reviews
    const reviewsContainer = document.getElementById('reviews-list');
    if (reviewsContainer) {
        fetch('/api/reviews')
            .then(res => res.json())
            .then(reviews => {
                reviewsContainer.innerHTML = '';
                reviews.forEach(r => {
                    const statusClass = r.status.toLowerCase() === 'accepted' ? 'status-accepted' : r.status.toLowerCase() === 'rejected' ? 'status-rejected' : 'status-pending';
                    const card = document.createElement('div');
                    card.className = 'review-card';
                    
                    let buttonsHtml = '';
                    if (r.status.toLowerCase() === 'pending') {
                        buttonsHtml = `
                            <div style="margin-top: 16px; display: flex; gap: 8px;">
                                <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="window.updateReviewStatus('${r.id || r._id}', 'Accepted', this)">Accept Review</button>
                                <button class="btn-outline" style="padding: 6px 12px; font-size: 12px; width: auto;" onclick="window.updateReviewStatus('${r.id || r._id}', 'Rejected', this)">Reject</button>
                            </div>
                        `;
                    }
                    
                    card.innerHTML = `
                        <div class="review-card-left">
                            <h3>${r.paperTitle}</h3>
                            <p>Reviewed by ${r.reviewer} · ${new Date(r.date).toLocaleDateString()}</p>
                            <div class="review-comment">"${r.comments}"</div>
                            ${buttonsHtml}
                        </div>
                        <div class="review-status ${statusClass}">${r.status}</div>
                    `;
                    reviewsContainer.appendChild(card);
                });
            });
    }

    // 7. Event Listeners for new POST APIs
    const btnCreateBranch = document.getElementById('btn-create-branch');
    if (btnCreateBranch) {
        btnCreateBranch.addEventListener('click', async () => {
            const nameInput = document.getElementById('new-branch-name');
            const message = nameInput && nameInput.value ? nameInput.value : 'New experimental branch';
            try {
                const res = await fetch('/api/versions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, author: user.name })
                });
                if (res.ok) {
                    closeModal('create-branch-modal');
                    if (nameInput) nameInput.value = '';
                    fetchVersions();
                }
            } catch (err) { console.error(err); }
        });
    }

    const btnUploadDataset = document.getElementById('btn-upload-dataset');
    if (btnUploadDataset) {
        btnUploadDataset.addEventListener('click', async () => {
            const titleInput = document.getElementById('new-dataset-title');
            const title = titleInput && titleInput.value ? titleInput.value : 'Uploaded Dataset';
            try {
                const res = await fetch('/api/datasets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, uploader: user.name })
                });
                if (res.ok) {
                    closeModal('upload-modal');
                    if (titleInput) titleInput.value = '';
                    fetchDatasets();
                }
            } catch (err) { console.error(err); }
        });
    }

    // 7. Citation Graph Logic
    const initCitationGraph = async () => {
        const canvas = document.getElementById('citation-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 500;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0) {
                    canvas.width = entry.contentRect.width;
                    canvas.height = entry.contentRect.height;
                }
            }
        });
        resizeObserver.observe(canvas.parentElement);
        
        try {
            const res = await window.fetch('/api/papers');
            const papers = await res.json();
            
            const nodes = [{
                id: 'center',
                label: 'You',
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: 0,
                vy: 0,
                radius: 16,
                color: 'var(--accent-green)'
            }];
            
            papers.forEach((p, i) => {
                nodes.push({
                    id: p.id || p._id || i,
                    label: p.title,
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    radius: Math.max(4, Math.min(12, (p.citations || 10) / 5)),
                    color: Math.random() > 0.5 ? 'var(--accent-blue)' : '#9CA3AF'
                });
            });
            
            const edges = [];
            for (let i = 1; i < nodes.length; i++) {
                edges.push({ source: nodes[i], target: nodes[0] });
                if (Math.random() > 0.6 && i > 1) {
                    edges.push({ source: nodes[i], target: nodes[Math.floor(Math.random() * (i-1)) + 1] });
                }
            }
            
            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                nodes.forEach(n => {
                    if (n.id !== 'center') {
                        n.x += n.vx;
                        n.y += n.vy;
                        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
                        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
                    } else {
                        n.x = canvas.width / 2;
                        n.y = canvas.height / 2;
                    }
                });
                
                ctx.strokeStyle = 'rgba(161, 27, 53, 0.15)';
                ctx.lineWidth = 1;
                edges.forEach(e => {
                    ctx.beginPath();
                    ctx.moveTo(e.source.x, e.source.y);
                    ctx.lineTo(e.target.x, e.target.y);
                    ctx.stroke();
                });
                
                nodes.forEach(n => {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                    ctx.fillStyle = n.id === 'center' ? '#A11B35' : (n.color.startsWith('var') ? '#8A1538' : n.color);
                    if (n.id === 'center') {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#A11B35';
                    } else {
                        ctx.shadowBlur = 0;
                    }
                    ctx.fill();
                });
                ctx.shadowBlur = 0;
                
                requestAnimationFrame(animate);
            };
            animate();
        } catch(err) {
            console.error(err);
        }
    };
    setTimeout(initCitationGraph, 500);

    // 8. Admin View Logic
    window.fetchAdminUsers = async () => {
        const list = document.getElementById('admin-users-list');
        if (!list) return;
        try {
            const res = await fetch('/api/users');
            const users = await res.json();
            list.innerHTML = '';
            users.forEach(u => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid var(--border-color)';
                row.innerHTML = `
                    <td style="padding: 12px;">${u.first_name} ${u.last_name}</td>
                    <td style="padding: 12px;">${u.email}</td>
                    <td style="padding: 12px;"><span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${u.role === 'admin' ? 'rgba(46, 160, 113, 0.1)' : 'rgba(255,255,255,0.05)'}; color: ${u.role === 'admin' ? 'var(--accent-green)' : 'inherit'}">${u.role}</span></td>
                    <td style="padding: 12px;">
                        ${u.role !== 'admin' ? `<button class="btn-outline" style="padding: 4px 12px; font-size: 12px; border-color: #ef4444; color: #ef4444;" onclick="deleteUser('${u.user_id}')">Delete</button>` : ''}
                    </td>
                `;
                list.appendChild(row);
            });
        } catch (err) { console.error(err); }
    };

    window.deleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) window.fetchAdminUsers();
        } catch (err) { console.error(err); }
    };

    // Ensure admin users are fetched on direct load
    if (window.location.hash === '#admin' && user.role === 'admin') {
        window.fetchAdminUsers();
    }

    // Phase 1: Collaborative Editor Logic
    const editorArea = document.querySelector('.modal-body [contenteditable="true"]');
    if (editorArea) {
        editorArea.addEventListener('input', () => {
            const content = editorArea.innerHTML;
            socket.emit('editor_change', { content, user: user.name });
        });

        socket.on('editor_sync', (data) => {
            if (editorArea.innerHTML !== data.content) {
                editorArea.innerHTML = data.content;
            }
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.textContent = `🟢 ${data.user} is typing...`;
                typingIndicator.style.display = 'flex';
                clearTimeout(window.typingTimeout);
                window.typingTimeout = setTimeout(() => {
                    typingIndicator.style.display = 'none';
                }, 2000);
            }
        });
    }

    // Phase 2: Advanced Search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('#papers-list .paper-row-card');
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }

    // Phase 3: Notifications
    let notifCount = 0;
    const notifBadge = document.getElementById('notif-badge');
    
    socket.on('new_notification', (data) => {
        notifCount++;
        if (notifBadge) {
            notifBadge.textContent = notifCount;
            notifBadge.style.display = 'flex';
            // Alert or toast could go here
            document.querySelector('.greeting-subtext').textContent = data.msg;
        }
    });

    // Phase 5: PDF Export
    window.exportToPDF = () => {
        const currentEditor = document.querySelector('.modal-body [contenteditable="true"]');
        if (!currentEditor) return;
        const opt = {
            margin:       1,
            filename:     'ResearchNexus_Draft.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        // html2pdf from CDN
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(currentEditor).save();
        } else {
            alert('PDF Export library is still loading. Please try again in a few seconds.');
        }
    };

    // Phase 7: AI Assistant Integration
    window.callAIAssistant = async (event) => {
        const editor = document.querySelector('.modal-body [contenteditable="true"]');
        if (!editor) return;
        
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✨ Thinking...';
        btn.disabled = true;
        
        try {
            const res = await window.fetch('/api/ai/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: 'generate ideas' })
            });
            const data = await res.json();
            
            if (!res.ok) {
                alert(data.error || 'AI Failed');
                return;
            }
            
            // Insert suggestion 
            editor.innerHTML += `<span style="background-color: #e0f2fe; color: #0284c7; padding: 2px 4px; border-radius: 4px; margin: 0 4px;">${data.suggestion}</span>`;
            
            // Trigger the collaborative sync manually since innerHTML change bypasses the 'input' event listener
            socket.emit('editor_change', { content: editor.innerHTML, user: user.name });
            
        } catch (err) {
            console.error(err);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    };
});

window.fetchAdminUsers = async () => {
    const list = document.getElementById('admin-users-list');
    if (!list) return;
    
    list.innerHTML = '<tr><td colspan="4" style="padding: 16px; text-align: center;">Loading users...</td></tr>';
    
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        if (data.success && data.users && data.users.length > 0) {
            list.innerHTML = '';
            data.users.forEach(u => {
                const badgeClass = u.role === 'admin' ? 'badge-primary' : 'badge-secondary';
                list.innerHTML += `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 12px; font-weight: 500;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div class="avatar-small" style="width: 24px; height: 24px; font-size: 10px;">${(u.name || 'U').substring(0,2).toUpperCase()}</div>
                                ${u.name || 'Unknown'}
                            </div>
                        </td>
                        <td style="padding: 12px; color: var(--text-secondary);">${u.email || 'N/A'}</td>
                        <td style="padding: 12px;">
                            <span class="badge ${badgeClass}">${(u.role || 'user').toUpperCase()}</span>
                        </td>
                        <td style="padding: 12px;">
                            <button class="btn-outline" style="padding: 4px 8px; font-size: 12px;" ${u.role === 'admin' ? 'disabled' : ''}>Promote</button>
                        </td>
                    </tr>
                `;
            });
        } else {
            list.innerHTML = '<tr><td colspan="4" style="padding: 16px; text-align: center;">No users found in database.</td></tr>';
        }
    } catch (err) {
        console.error("Error fetching admin users:", err);
        list.innerHTML = `<tr><td colspan="4" style="padding: 16px; text-align: center; color: red;">Error fetching users: ${err.message}</td></tr>`;
    }
};
