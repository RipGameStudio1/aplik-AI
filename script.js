document.addEventListener('DOMContentLoaded', function() {
    const pagesContainer = document.querySelector('.pages-container');
    const pages = document.querySelectorAll('.page');
    const dots = document.querySelectorAll('.dot');
    const nextButtons = document.querySelectorAll('.next-button');
    const pageIndicator = document.querySelector('.page-indicator');
    
    // Добавляем CSS для регулировки контейнера
    const flexibleContainerStyle = document.createElement('style');
    flexibleContainerStyle.textContent = `
        .container {
            position: relative;
            width: 100vw;
            max-width: calc(min(100vh * 9 / 16 + 100px, 100vw));
            min-width: calc(100vh * 9 / 16);
            height: 100vh;
            overflow: hidden;
            background: linear-gradient(145deg, #ffffff, #f5f7fa);
            margin: 0 auto;
        }

        @media (max-width: calc(100vh * 9 / 16)) {
            .container {
                width: 100vw;
                min-width: 100vw;
                height: calc(100vw * 16 / 9);
                max-height: 100vh;
                border-radius: 0;
            }
        }
        
        /* Фиксируем позиции левых элементов в абсолютных величинах */
        .welcome-text, .main-text, .welcome-content, .page2-content, .page-indicator {
            left: calc(min(100vh * 9 / 16, 100vw) * 0.06); /* 6% от базовой ширины */
        }
    `;
    document.head.appendChild(flexibleContainerStyle);
    
    let currentPageIndex = 0;
    let startX, startY;
    let isDragging = false;
    let isAnimating = false;
    let initialAnimationPlayed = false; // Флаг, который отслеживает, проигрывалась ли уже анимация
    
    // Элементы текста и изображения на первой странице
    const welcomeText = document.querySelector('.welcome-text');
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    const nextButton = document.querySelector('#page1 .next-button');
    const characterImage = document.querySelector('.character-image');
    
    // Сохраняем оригинальные тексты
    const originalWelcomeText = welcomeText.textContent;
    const originalTitle = pageTitle.textContent;
    const originalSubtitle = pageSubtitle.textContent;
    
    // Очищаем тексты и скрываем Аплика
    welcomeText.textContent = '';
    pageTitle.textContent = '';
    pageSubtitle.textContent = '';
    characterImage.style.opacity = '0';
    
    // Создаем элемент курсора
    const cursorStyle = document.createElement('style');
    cursorStyle.textContent = `
        .typing-cursor {
            display: inline-block;
            width: 2px;
            height: 0.9em;
            background-color: currentColor;
            margin-left: 2px;
            vertical-align: middle;
            animation: blink 1s infinite;
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
    `;
    document.head.appendChild(cursorStyle);
    
    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', handleResize);
    
    // Начальная анимация при загрузке страницы
    setTimeout(() => {
        // Сначала плавно показываем Аплика
        characterImage.style.transition = 'opacity 0.8s ease';
        characterImage.style.opacity = '1';
        
        // Затем начинаем печатать текст
        setTimeout(() => {
            startTypingAnimation();
        }, 500);
    }, 400);
    
    // Обработчики кнопок переключения
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isAnimating) return;
            
            const targetPageId = this.getAttribute('data-go-to');
            let targetIndex = 0;
            
            pages.forEach((page, index) => {
                if (page.id === targetPageId) {
                    targetIndex = index;
                }
            });
            
            goToPage(targetIndex);
        });
    });
    
    // Обработка нажатий на точки
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            if (isAnimating) return;
            goToPage(index);
        });
    });
    
    // Обработка свайпов
    pagesContainer.addEventListener('touchstart', function(e) {
        if (isAnimating) return;
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    });
    
    pagesContainer.addEventListener('touchmove', function(e) {
        if (!isDragging || isAnimating) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const diffX = startX - currentX;
        const diffY = startY - currentY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            e.preventDefault();
        }
    });
    
    pagesContainer.addEventListener('touchend', function(e) {
        if (!isDragging || isAnimating) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const diffX = startX - endX;
        const diffY = startY - endY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
            if (diffX > 0 && currentPageIndex < pages.length - 1) {
                // Свайп влево - следующая страница
                goToPage(currentPageIndex + 1);
            } else if (diffX < 0 && currentPageIndex > 0) {
                // Свайп вправо - предыдущая страница
                goToPage(currentPageIndex - 1);
            }
        }
        
        isDragging = false;
    });
    
    // Обработчик изменения размера окна
    function handleResize() {
        if (initialAnimationPlayed && currentPageIndex === 0) {
            prepareFirstPageForInstantAppearance();
        }
    }
    
    // Функция перехода на страницу
    function goToPage(index) {
        if (index === currentPageIndex || isAnimating) return;
        
        isAnimating = true;
        
        // Определяем направление перехода
        const isForward = index > currentPageIndex;
        
        // Текущая страница
        const currentPage = pages[currentPageIndex];
        // Новая страница
        const newPage = pages[index];
        
        // Убираем все классы с новой страницы
        newPage.classList.remove('active', 'slide-left', 'slide-right');
        
        // Подготавливаем новую страницу
        if (isForward) {
            // Устанавливаем новую страницу справа (для появления справа)
            newPage.style.transform = 'translateX(100%)';
        } else {
            // Устанавливаем новую страницу слева (для появления слева)
            newPage.style.transform = 'translateX(-100%)';
        }
        
        newPage.style.opacity = '0';
        newPage.style.visibility = 'visible';
        
        // Если переходим на первую страницу и анимация уже была проиграна,
        // подготавливаем элементы к мгновенному появлению
        if (index === 0 && initialAnimationPlayed) {
            prepareFirstPageForInstantAppearance();
        }
        
        // Запускаем анимацию через requestAnimationFrame для лучшей производительности
        requestAnimationFrame(() => {
            // Запускаем анимацию ухода текущей страницы
            if (isForward) {
                currentPage.style.transform = 'translateX(-100%)';
            } else {
                currentPage.style.transform = 'translateX(100%)';
            }
            currentPage.style.opacity = '0';
            
            // Запускаем анимацию появления новой страницы
            requestAnimationFrame(() => {
                newPage.style.transform = 'translateX(0)';
                newPage.style.opacity = '1';
                newPage.classList.add('active');
            });
        });
        
        // Обновляем индикатор
        updateActiveDot(index);
        
        // После завершения анимации очищаем классы
        setTimeout(() => {
            currentPage.classList.remove('active');
            currentPage.style.visibility = 'hidden';
            isAnimating = false;
        }, 600); // Время должно соответствовать времени анимации в CSS
        
        // Обновляем текущий индекс
        currentPageIndex = index;
    }
    
    // Функция для мгновенного показа элементов первой страницы
    function prepareFirstPageForInstantAppearance() {
        welcomeText.textContent = originalWelcomeText;
        pageTitle.textContent = originalTitle;
        pageSubtitle.textContent = originalSubtitle;
        
        welcomeText.style.opacity = '1';
        pageTitle.style.opacity = '1';
        pageSubtitle.style.opacity = '1';
        
        characterImage.style.opacity = '1';
        pageIndicator.style.opacity = '1';
        pageIndicator.style.transform = 'translateY(0)';
        nextButton.style.opacity = '1';
        nextButton.style.transform = 'translateY(0)';
    }
    
    // Обновление активной точки
    function updateActiveDot(index) {
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Функция для анимации печатающегося текста
    function typeText(element, text, speed, callback) {
        element.style.opacity = '1';
        let i = 0;
        let currentText = '';
        
        // Очищаем элемент и добавляем элемент для курсора
        element.innerHTML = '';
        const textSpan = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        
        element.appendChild(textSpan);
        element.appendChild(cursor);
        
        function type() {
            if (i < text.length) {
                currentText += text.charAt(i);
                textSpan.textContent = currentText;
                i++;
                setTimeout(type, speed);
            } else {
                // Удаляем курсор после завершения
                element.removeChild(cursor);
                if (callback) {
                    callback();
                }
            }
        }
        
        type();
    }
    
    // Запуск анимации печатания в нужной последовательности
    function startTypingAnimation() {
        // Сначала "Привет!" - ускоренная печать
        typeText(welcomeText, originalWelcomeText, 60, function() {
            // Затем "Меня зовут Аплик!"
            setTimeout(() => {
                typeText(pageTitle, originalTitle, 70, function() {
                    // И наконец "я помогу тебе на пути к цели! ✨"
                    setTimeout(() => {
                        typeText(pageSubtitle, originalSubtitle, 50, function() {
                            // После завершения печатания показываем кнопку и индикаторы
                            setTimeout(() => {
                                pageIndicator.style.opacity = '1';
                                pageIndicator.style.transform = 'translateY(0)';
                                
                                // Почти сразу показываем кнопку
                                setTimeout(() => {
                                    nextButton.style.opacity = '1';
                                    nextButton.style.transform = 'translateY(0)';
                                    // Отмечаем, что начальная анимация была проиграна
                                    initialAnimationPlayed = true;
                                }, 100);
                            }, 150);
                        });
                    }, 200);
                });
            }, 200);
        });
    }
});
