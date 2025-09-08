// LINE Flex Message ライブラリ
// 業務マニュアルBotで使用するフレックスメッセージテンプレート

/**
 * フレックスメッセージ作成クラス
 */
export class FlexMessageHandler {
  constructor() {
    // 基本カラーテーマ
    this.colors = {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      light: '#f8f9fa',
      dark: '#343a40'
    };
  }

  /**
   * マニュアル検索結果用のフレックスメッセージ
   * @param {Array} results - 検索結果配列
   * @param {string} keyword - 検索キーワード
   * @returns {Object} フレックスメッセージ
   */
  createSearchResultsFlex(results, keyword) {
    const contents = results.slice(0, 5).map(result => ({
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: result.title,
          weight: 'bold',
          size: 'md',
          color: this.colors.dark,
          wrap: true,
          action: {
            type: 'postback',
            data: `action=view_manual&title=${encodeURIComponent(result.title)}`
          }
        },
        {
          type: 'text',
          text: result.category || 'その他',
          size: 'sm',
          color: this.colors.secondary,
          margin: 'xs'
        },
        {
          type: 'text',
          text: result.description || result.content?.substring(0, 60) + '...',
          size: 'sm',
          color: this.colors.dark,
          wrap: true,
          margin: 'sm'
        },
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: '📊',
              size: 'sm'
            },
            {
              type: 'text',
              text: `適合度: ${Math.round(result.score * 100)}%`,
              size: 'xs',
              color: this.colors.secondary,
              margin: 'xs'
            }
          ],
          margin: 'md'
        }
      ],
      paddingAll: '16px',
      backgroundColor: this.colors.light,
      cornerRadius: '8px',
      margin: 'sm',
      action: {
        type: 'postback',
        data: `action=view_manual&title=${encodeURIComponent(result.title)}`
      }
    }));

    return {
      type: 'flex',
      altText: `${keyword}の検索結果（${results.length}件）`,
      contents: {
        type: 'carousel',
        contents: contents.map(content => ({
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🔍 検索結果',
                weight: 'bold',
                size: 'lg',
                color: '#ffffff'
              },
              {
                type: 'text',
                text: `キーワード: ${keyword}`,
                size: 'sm',
                color: '#ffffff',
                margin: 'xs'
              }
            ],
            backgroundColor: this.colors.primary,
            paddingAll: '16px'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [content]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'postback',
                  data: `action=view_manual&title=${encodeURIComponent(results[0]?.title)}`
                },
                label: '詳細を見る',
                style: 'primary',
                color: this.colors.primary
              }
            ],
            spacing: 'sm'
          }
        }))
      }
    };
  }

  /**
   * カテゴリ一覧用のフレックスメッセージ
   * @param {Array} categories - カテゴリ配列
   * @returns {Object} フレックスメッセージ
   */
  createCategoryListFlex(categories) {
    const categoryButtons = categories.map(category => ({
      type: 'button',
      action: {
        type: 'postback',
        data: `action=search_category&category=${encodeURIComponent(category.name)}`
      },
      label: `${category.icon} ${category.name}`,
      style: 'secondary',
      margin: 'sm'
    }));

    return {
      type: 'flex',
      altText: 'カテゴリ一覧',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📁 カテゴリ一覧',
              weight: 'bold',
              size: 'xl',
              color: '#ffffff'
            },
            {
              type: 'text',
              text: 'カテゴリを選択してください',
              size: 'sm',
              color: '#ffffff',
              margin: 'xs'
            }
          ],
          backgroundColor: this.colors.success,
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: categoryButtons.slice(0, 8),
          spacing: 'sm',
          paddingAll: '16px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '💡 または直接カテゴリ名を入力してください',
              size: 'xs',
              color: this.colors.secondary,
              wrap: true,
              align: 'center'
            }
          ],
          paddingAll: '12px'
        }
      }
    };
  }

  /**
   * 人気マニュアル用のフレックスメッセージ
   * @param {Array} popularManuals - 人気マニュアル配列
   * @returns {Object} フレックスメッセージ
   */
  createPopularManualsFlex(popularManuals) {
    const manualItems = popularManuals.slice(0, 10).map((manual, index) => ({
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `${index + 1}`,
              size: 'lg',
              weight: 'bold',
              color: this.colors.primary,
              align: 'center'
            }
          ],
          flex: 0,
          width: '40px'
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: manual.title,
              weight: 'bold',
              size: 'md',
              wrap: true,
              action: {
                type: 'postback',
                data: `action=view_manual&title=${encodeURIComponent(manual.title)}`
              }
            },
            {
              type: 'text',
              text: `📈 ${manual.accessCount}回アクセス`,
              size: 'sm',
              color: this.colors.secondary,
              margin: 'xs'
            }
          ],
          flex: 1,
          margin: 'md'
        }
      ],
      margin: 'md',
      action: {
        type: 'postback',
        data: `action=view_manual&title=${encodeURIComponent(manual.title)}`
      }
    }));

    return {
      type: 'flex',
      altText: `人気マニュアル（${popularManuals.length}件）`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📊 人気マニュアル',
              weight: 'bold',
              size: 'xl',
              color: '#ffffff'
            },
            {
              type: 'text',
              text: `トップ${popularManuals.length}`,
              size: 'sm',
              color: '#ffffff',
              margin: 'xs'
            }
          ],
          backgroundColor: this.colors.warning,
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: manualItems,
          paddingAll: '16px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                data: 'action=search'
              },
              label: '🔍 マニュアル検索',
              style: 'primary',
              color: this.colors.primary
            }
          ],
          paddingAll: '16px'
        }
      }
    };
  }

  /**
   * マイページ用のフレックスメッセージ
   * @param {Object} user - ユーザー情報
   * @param {Object} stats - ユーザー統計
   * @returns {Object} フレックスメッセージ
   */
  createMyPageFlex(user, stats) {
    return {
      type: 'flex',
      altText: `${user.name}さんのマイページ`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '👤 マイページ',
              weight: 'bold',
              size: 'xl',
              color: '#ffffff'
            },
            {
              type: 'text',
              text: `${user.name}さん`,
              size: 'lg',
              color: '#ffffff',
              margin: 'xs'
            }
          ],
          backgroundColor: this.colors.secondary,
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '📊 利用統計',
                  weight: 'bold',
                  size: 'md',
                  color: this.colors.dark
                },
                {
                  type: 'separator',
                  margin: 'md'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: '検索回数:',
                      size: 'sm',
                      color: this.colors.secondary,
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: `${stats.totalSearches}回`,
                      size: 'sm',
                      color: this.colors.dark,
                      flex: 3,
                      align: 'end'
                    }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'よく使うカテゴリ:',
                      size: 'sm',
                      color: this.colors.secondary,
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: stats.topCategory,
                      size: 'sm',
                      color: this.colors.dark,
                      flex: 3,
                      align: 'end'
                    }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: '権限レベル:',
                      size: 'sm',
                      color: this.colors.secondary,
                      flex: 2
                    },
                    {
                      type: 'text',
                      text: user.permission,
                      size: 'sm',
                      color: this.colors.primary,
                      flex: 3,
                      align: 'end',
                      weight: 'bold'
                    }
                  ],
                  margin: 'md'
                }
              ]
            }
          ],
          paddingAll: '20px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                data: 'action=search_history'
              },
              label: '📋 検索履歴',
              style: 'secondary',
              margin: 'sm'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                data: 'action=search'
              },
              label: '🔍 マニュアル検索',
              style: 'primary',
              color: this.colors.primary,
              margin: 'sm'
            }
          ],
          spacing: 'sm',
          paddingAll: '16px'
        }
      }
    };
  }

  /**
   * クイックアクション用のフレックスメッセージ
   * @returns {Object} フレックスメッセージ
   */
  createQuickActionFlex() {
    return {
      type: 'flex',
      altText: 'クイックアクション',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '⚡ クイックアクション',
              weight: 'bold',
              size: 'lg',
              color: this.colors.dark,
              align: 'center',
              margin: 'md'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    data: 'action=search'
                  },
                  label: '🔍 マニュアル検索',
                  style: 'primary',
                  color: this.colors.primary,
                  margin: 'md'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    data: 'action=category'
                  },
                  label: '📁 カテゴリ一覧',
                  style: 'secondary',
                  margin: 'sm'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    data: 'action=popular'
                  },
                  label: '📊 人気マニュアル',
                  style: 'secondary',
                  margin: 'sm'
                },
                {
                  type: 'button',
                  action: {
                    type: 'postback',
                    data: 'action=inquiry'
                  },
                  label: '📝 お問い合わせ',
                  style: 'secondary',
                  margin: 'sm'
                }
              ]
            }
          ],
          paddingAll: '20px'
        }
      }
    };
  }

  /**
   * エラー表示用のフレックスメッセージ
   * @param {string} title - エラータイトル
   * @param {string} message - エラーメッセージ
   * @returns {Object} フレックスメッセージ
   */
  createErrorFlex(title = 'エラーが発生しました', message = '申し訳ございません。しばらく経ってから再度お試しください。') {
    return {
      type: 'flex',
      altText: title,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '❌ エラー',
              weight: 'bold',
              size: 'xl',
              color: '#ffffff'
            }
          ],
          backgroundColor: this.colors.danger,
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: title,
              weight: 'bold',
              size: 'md',
              color: this.colors.dark,
              wrap: true
            },
            {
              type: 'text',
              text: message,
              size: 'sm',
              color: this.colors.secondary,
              wrap: true,
              margin: 'md'
            }
          ],
          paddingAll: '20px'
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                data: 'action=help'
              },
              label: '❓ ヘルプを見る',
              style: 'secondary',
              margin: 'sm'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                data: 'action=inquiry'
              },
              label: '📝 問い合わせ',
              style: 'primary',
              color: this.colors.primary,
              margin: 'sm'
            }
          ],
          spacing: 'sm',
          paddingAll: '16px'
        }
      }
    };
  }
}

/**
 * フレックスメッセージハンドラーのシングルトンインスタンス
 */
export const flexMessageHandler = new FlexMessageHandler();