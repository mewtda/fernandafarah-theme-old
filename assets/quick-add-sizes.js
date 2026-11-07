if (!customElements.get('quick-add-sizes')) {
  class QuickAddSizes extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;

      this.colorPos = parseInt(this.dataset.colorPos, 10) || 0;
      this.sizePos = parseInt(this.dataset.sizePos, 10) || 0;
      this.variants = this.readJSON('[data-qas-variants]') || [];
      this.sizes = this.readJSON('[data-qas-sizes]') || [];

      this.toggle = this.querySelector('.qas__toggle');
      this.panel = this.querySelector('.qas__panel');
      this.sizesEl = this.querySelector('.qas__sizes');
      this.form = this.querySelector('form');
      this.idInput = this.form && this.form.querySelector('[name="id"]');
      this.submit = this.querySelector('.qas__submit');

      // Não deixa os cliques chegarem ao link do card
      this.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('button')) e.preventDefault();
      });

      this.toggle.addEventListener('click', () => {
        if (this.sizePos === 0) {
          const variant = this.findVariant(null);
          if (variant) this.add(variant.id);
          return;
        }
        this.isOpen() ? this.close() : this.open();
      });

      const closeBtn = this.querySelector('.qas__close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      this.onOutside = (e) => {
        if (!this.contains(e.target)) this.close();
      };
      this.onKey = (e) => {
        if (e.key === 'Escape') {
          this.close();
          this.toggle.focus();
        }
      };
    }

    readJSON(selector) {
      const el = this.querySelector(selector);
      if (!el) return null;
      try {
        return JSON.parse(el.textContent);
      } catch (e) {
        return null;
      }
    }

    activeColor() {
      if (!this.colorPos) return null;
      const card = this.closest('.product-item') || this.parentElement;
      const active = card && card.querySelector('.product__color-swatches--js.active');
      if (active && active.dataset.value) return active.dataset.value;
      const first =
        this.variants.find((v) => v.available) || this.variants[0];
      return first ? first.options[this.colorPos - 1] : null;
    }

    findVariant(size) {
      const color = this.activeColor();
      const matches = this.variants.filter((v) => {
        if (color !== null && this.colorPos && v.options[this.colorPos - 1] !== color) return false;
        if (size !== null && this.sizePos && v.options[this.sizePos - 1] !== size) return false;
        return true;
      });
      return matches.find((v) => v.available) || null;
    }

    render() {
      const color = this.activeColor();
      this.sizesEl.innerHTML = '';
      this.sizes.forEach((size) => {
        const variant = this.variants.find(
          (v) =>
            v.options[this.sizePos - 1] === size &&
            (color === null || !this.colorPos || v.options[this.colorPos - 1] === color)
        );
        if (!variant) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'qas__size';
        btn.textContent = size;
        if (!variant.available) {
          btn.disabled = true;
          btn.setAttribute('aria-label', size + ' (esgotado)');
        } else {
          btn.addEventListener('click', () => this.add(variant.id, btn));
        }
        this.sizesEl.appendChild(btn);
      });
    }

    isOpen() {
      return this.panel && !this.panel.hidden;
    }

    open() {
      document.querySelectorAll('quick-add-sizes').forEach((el) => {
        if (el !== this && el.close) el.close();
      });
      this.render();
      this.panel.hidden = false;
      this.classList.add('is-open');
      this.toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', this.onOutside);
      document.addEventListener('keydown', this.onKey);
      const first = this.sizesEl.querySelector('.qas__size:not([disabled])');
      if (first) first.focus({ preventScroll: true });
    }

    close() {
      if (!this.panel || this.panel.hidden) return;
      this.panel.hidden = true;
      this.classList.remove('is-open');
      this.toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', this.onOutside);
      document.removeEventListener('keydown', this.onKey);
    }

    add(variantId, btn) {
      if (!this.form || !this.idInput || this.classList.contains('is-loading')) return;
      this.idInput.disabled = false;
      this.idInput.value = variantId;
      this.classList.add('is-loading');
      if (btn) btn.classList.add('is-loading');

      // product-form remove a classe "loading" do botão quando a requisição termina
      const observer = new MutationObserver(() => {
        if (!this.submit.classList.contains('loading')) {
          observer.disconnect();
          this.finish(btn);
        }
      });
      this.form.requestSubmit(this.submit);
      if (this.submit.classList.contains('loading')) {
        observer.observe(this.submit, { attributes: true, attributeFilter: ['class'] });
      } else {
        this.finish(btn);
      }
    }

    finish(btn) {
      this.classList.remove('is-loading');
      if (btn) btn.classList.remove('is-loading');
      this.close();
      this.classList.add('is-added');
      clearTimeout(this._addedTimer);
      this._addedTimer = setTimeout(() => this.classList.remove('is-added'), 1800);
    }
  }

  customElements.define('quick-add-sizes', QuickAddSizes);
}
