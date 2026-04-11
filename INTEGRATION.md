# Guia de Integração - Mapa Rede Açaí

Para integrar este mapa em um site já existente (WordPress, Wix, HTML puro, etc.), a maneira mais simples e eficiente é utilizando um **iframe**.

## 1. Código de Integração (Embed)

Copie e cole o código abaixo no local onde deseja que o mapa apareça em seu site:

```html
<iframe 
  src="https://ais-pre-cdho72v32yvf7wcqwmeyir-208641958634.us-east1.run.app" 
  width="100%" 
  height="600px" 
  style="border:none; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);"
  title="Mapa Interativo Rede Açaí"
  allow="geolocation"
></iframe>
```

## 2. Personalização

- **Largura (`width`)**: Recomendamos usar `100%` para que o mapa se ajuste automaticamente à largura do container do seu site.
- **Altura (`height`)**: Você pode ajustar o valor de `600px` para mais ou para menos, dependendo do espaço disponível.
- **Bordas e Sombra**: O estilo `border-radius: 24px` e `box-shadow` garante que o mapa tenha um visual moderno e "flutuante", combinando com sites atuais.

## 3. Observações Importantes

1. **Permissões**: O atributo `allow="geolocation"` é importante caso você queira que o mapa peça permissão para ver a localização do usuário (útil para rotas).
2. **Responsividade**: O iframe já é naturalmente responsivo se a largura estiver em `100%`. No celular, ele se ajustará perfeitamente.
3. **URL de Produção**: A URL utilizada acima é a versão compartilhada (Preview). Se você fizer alterações no código, elas serão refletidas automaticamente no iframe.

---
*Dica: Se o seu site for feito em React, você também pode exportar o componente `Map.tsx` e utilizá-lo diretamente como um componente interno.*
