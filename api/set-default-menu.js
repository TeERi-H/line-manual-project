// デフォルトリッチメニュー設定API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { createLineClient } = await import('../lib/lineAuth.js');
    const client = createLineClient();
    
    // 作成済みのリッチメニューIDを使用
    const richMenuId = 'richmenu-961d99e68b770a9eccbf2dfc79b173f8';
    
    // デフォルトリッチメニューに設定
    await client.setDefaultRichMenu(richMenuId);
    
    return res.status(200).json({
      success: true,
      message: 'デフォルトリッチメニューを設定しました',
      richMenuId: richMenuId,
      instructions: [
        '1. LINEアプリを完全に終了してください',
        '2. 30秒お待ちください',
        '3. LINEアプリを再起動してください',
        '4. 業務マニュアルBotのトークを開いてください',
        '5. 画面下部にリッチメニューが表示されます'
      ]
    });
    
  } catch (error) {
    console.error('Set default menu error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'デフォルトリッチメニューの設定に失敗しました'
    });
  }
}